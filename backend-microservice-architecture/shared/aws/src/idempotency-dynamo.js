import { DeleteItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

import { getDynamoDbClient } from "./clients.js";

/**
 * DynamoDB-backed idempotency store.
 *
 * Used by consumers that have **no business database of their own**: the email
 * worker (SQS → SES) and any future queue-driven worker. Business services use
 * their own MongoDB cluster instead — this exists precisely because a worker
 * must not be given access to a service's cluster just to remember what it has
 * already done.
 *
 * The claim is a conditional `PutItem` (`attribute_not_exists(pk)`), which is
 * atomic: two concurrent deliveries of the same message cannot both win. `ttl`
 * expires the records so the table stays bounded without a cleanup job.
 *
 * Implements the `{ claim, release }` protocol expected by
 * `@lifebookz/shared-events`' `createIdempotencyGuard`.
 */
export function createDynamoIdempotencyStore({ table, client, region, service = "worker", ttlSeconds = 60 * 60 * 24 * 7 } = {}) {
  if (!table) throw new Error("createDynamoIdempotencyStore requires a DynamoDB table name");

  const dynamo = () => client || getDynamoDbClient({ region });

  const keyFor = (id) => `${service}:${id}`;

  return {
    /**
     * @returns {Promise<boolean>} true when this delivery won the claim
     *          (first time), false when the work was already done.
     */
    async claim(id, meta = {}) {
      const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;

      try {
        await dynamo().send(
          new PutItemCommand({
            TableName: table,
            Item: {
              pk: { S: keyFor(id) },
              ttl: { N: String(expiresAt) },
              claimedAt: { S: new Date().toISOString() },
              ...(meta.eventType ? { eventType: { S: String(meta.eventType) } } : {}),
              ...(meta.jobId ? { jobId: { S: String(meta.jobId) } } : {}),
              ...(meta.sqsMessageId ? { sqsMessageId: { S: String(meta.sqsMessageId) } } : {}),
            },
            ConditionExpression: "attribute_not_exists(pk)",
          }),
        );

        return true;
      } catch (error) {
        if (error?.name === "ConditionalCheckFailedException") return false;

        // A transport/permission failure is NOT a duplicate: swallow it would
        // silently drop the work, so it has to surface as a retryable error.
        throw error;
      }
    },

    /** Undo the claim so an SQS redelivery actually retries the work. */
    async release(id) {
      await dynamo().send(new DeleteItemCommand({ TableName: table, Key: { pk: { S: keyFor(id) } } }));
    },
  };
}
