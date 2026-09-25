import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { SQSClient } from "@aws-sdk/client-sqs";

/**
 * Clients are created once per Lambda container and reused. Re-creating a
 * client per invocation rebuilds the HTTP connection pool and pushes TTFB and
 * memory up for no reason.
 */
const cache = new Map();

function cached(key, factory) {
  if (!cache.has(key)) cache.set(key, factory());
  return cache.get(key);
}

export function getSesClient({ region = process.env.SES_REGION || process.env.AWS_REGION } = {}) {
  return cached(`ses:${region}`, () => new SESv2Client({ region }));
}

export function getSqsClient({ region = process.env.AWS_REGION } = {}) {
  return cached(`sqs:${region}`, () => new SQSClient({ region }));
}

export function getDynamoDbClient({ region = process.env.AWS_REGION } = {}) {
  return cached(`dynamodb:${region}`, () => new DynamoDBClient({ region }));
}

export function getSecretsManagerClient({ region = process.env.AWS_REGION } = {}) {
  return cached(`secretsmanager:${region}`, () => new SecretsManagerClient({ region }));
}

/**
 * Cloudflare R2 is S3-compatible, and two of the S3 client defaults break it.
 *
 * 1. `forcePathStyle` — R2 only serves path-style requests
 *    (`endpoint/bucket/key`); the SDK's default virtual-host style
 *    (`bucket.endpoint`) answers AccessDenied.
 * 2. `requestChecksumCalculation` — the SDK's newer default attaches CRC32
 *    checksum headers/query parameters that R2 rejects, which broke presigned
 *    PUT uploads in the existing backend. `WHEN_REQUIRED` keeps them off.
 *
 * Both pitfalls were hit for real in the monolith (`core/config/r2.js`); they
 * are encoded here so no new service has to rediscover them.
 */
export function getR2Client({ endpoint, accessKeyId, secretAccessKey, region = "auto" } = {}) {
  return cached(`r2:${endpoint}:${accessKeyId}`, () =>
    new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
  );
}

/** Test seam: drop every cached client. */
export function resetClients() {
  cache.clear();
}

export const clientCacheSize = () => cache.size;
