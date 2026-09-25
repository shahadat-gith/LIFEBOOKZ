import { parseSqsBatch } from "@lifebookz/shared-events";
import { createLogger } from "@lifebookz/shared-logger";

import { config } from "./config.js";
import { createAnalyticsMapper, recordKey } from "./mapper.js";
import { createS3Sink } from "./s3.js";

export const logger = createLogger({
  service: "analytics-worker",
  functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
});

const realSink = () => createS3Sink({ bucket: config.bucket, prefix: config.prefix, logger });

/**
 * Analytics worker.
 *
 * EventBridge → SQS → this Lambda → S3 (Hive-partitioned JSONL) → Athena.
 *
 * Idempotency note: every record keeps its original `eventId`, and batches
 * are keyed with a random suffix, so a redelivered message can at worst
 * duplicate rows *within* S3 — deduplicated at query time by `eventId`
 * (documented in the README). This is the accepted trade-off for a worker
 * with no operational database; if exactly-once matters later, add the
 * DynamoDB claim exactly like the email worker.
 */
export function createHandler({ sink = realSink(), mapper = createAnalyticsMapper({ logger }), logger: log = logger } = {}) {
  return async function handler(event, context = {}) {
    const startedAt = Date.now();
    const { events, invalid } = parseSqsBatch(event);

    const batchItemFailures = invalid.map((item) => {
      log.error?.("Unparseable SQS message — routed to DLQ after retries", {
        messageId: item.messageId,
        error: item.error,
      });
      return { itemIdentifier: item.messageId };
    });

    const records = [];
    let failed = 0;

    for (const domainEvent of events) {
      const record = mapper.normalize(domainEvent);

      if (!record) {
        // Cannot be processed — a real failure, reported so SQS retries and
        // the DLQ eventually captures it.
        failed += 1;
        batchItemFailures.push({ itemIdentifier: domainEvent.sqs.messageId });
        continue;
      }

      records.push(record);
    }

    let written = 0;

    if (records.length > 0) {
      const body = records.map(mapper.line).join("\n") + "\n";
      const key = recordKey(records[0], new Date().getUTCHours(), { prefix: sink.prefix });

      try {
        await sink.put(key, body);
        written = records.length;
      } catch (error) {
        // The whole batch failed to persist: every message is retried by SQS.
        failed += records.length;
        for (const domainEvent of events) {
          batchItemFailures.push({ itemIdentifier: domainEvent.sqs.messageId });
        }

        log.failure?.("Analytics batch write failed — messages will be retried", error, {
          bucket: sink.bucket,
          key,
          records: records.length,
        });
      }
    }

    log.info?.("Analytics batch complete", {
      received: events.length + invalid.length,
      normalized: records.length,
      written,
      failed,
      duplicates: 0,
      durationMs: Date.now() - startedAt,
      requestId: context.awsRequestId,
      service: "analytics-worker",
    });

    return { batchItemFailures };
  };
}

const handler = createHandler();

export { handler };
export default handler;
