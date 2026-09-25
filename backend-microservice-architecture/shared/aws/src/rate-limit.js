import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import { getDynamoDbClient } from "./clients.js";

/**
 * Fixed-window rate limiter backed by DynamoDB with TTL.
 *
 * Why DynamoDB and not the service's MongoDB: these are short-lived counters
 * that must survive Lambda scaling, and DynamoDB's atomic `ADD` + TTL removal
 * gives that without touching the application cluster or adding cleanup jobs.
 *
 * Why API Gateway throttling is not enough: the API-level limit is global and
 * per-route, so it cannot express "at most 3 OTP requests per email per 15
 * minutes" or "at most 5 failed logins per account per 10 minutes". Those are
 * per-identity rules, so they must be enforced in the service.
 */
export function createRateLimiter({ table, client, region, service } = {}) {
  if (!table) throw new Error("createRateLimiter requires a DynamoDB table name");

  const dynamo = () => client || getDynamoDbClient({ region });

  return {
    /**
     * Count one attempt and report whether it is allowed.
     *
     * @param {object} params
     * @param {string} params.key            stable identity, e.g. `otp:email:a@b.com`
     * @param {number} params.limit          allowed attempts inside the window
     * @param {number} params.windowSeconds  window length (also the TTL)
     */
    async consume({ key, limit, windowSeconds, now = Date.now() }) {
      const expiresAt = Math.floor(now / 1000) + windowSeconds;

      const response = await dynamo().send(
        new UpdateItemCommand({
          TableName: table,
          Key: { pk: { S: `${service}:${key}` } },
          UpdateExpression:
            "SET #ttl = if_not_exists(#ttl, :ttl), #createdAt = if_not_exists(#createdAt, :now) ADD #count :one",
          ExpressionAttributeNames: { "#ttl": "ttl", "#count": "count", "#createdAt": "createdAt" },
          ExpressionAttributeValues: {
            ":ttl": { N: String(expiresAt) },
            ":now": { N: String(Math.floor(now / 1000)) },
            ":one": { N: "1" },
          },
          ReturnValues: "UPDATED_NEW",
        }),
      );

      const count = Number(response.Attributes?.count?.N || 1);
      const ttl = Number(response.Attributes?.ttl?.N || expiresAt);
      const allowed = count <= limit;

      return {
        allowed,
        count,
        limit,
        remaining: Math.max(limit - count, 0),
        retryAfterSeconds: allowed ? 0 : Math.max(ttl - Math.floor(now / 1000), 1),
      };
    },
  };
}

/**
 * In-memory limiter for unit tests / local development.
 * Never used in a deployed Lambda (each container would keep its own window).
 */
export function createInMemoryRateLimiter({ now = () => Date.now() } = {}) {
  const buckets = new Map();

  return {
    async consume({ key, limit, windowSeconds }) {
      const current = now();
      const bucket = buckets.get(key);

      if (!bucket || bucket.expiresAt <= current) {
        buckets.set(key, { count: 1, expiresAt: current + windowSeconds * 1000 });

        return { allowed: 1 <= limit, count: 1, limit, remaining: Math.max(limit - 1, 0), retryAfterSeconds: 0 };
      }

      bucket.count += 1;
      const allowed = bucket.count <= limit;

      return {
        allowed,
        count: bucket.count,
        limit,
        remaining: Math.max(limit - bucket.count, 0),
        retryAfterSeconds: allowed ? 0 : Math.max(Math.ceil((bucket.expiresAt - current) / 1000), 1),
      };
    },
  };
}
