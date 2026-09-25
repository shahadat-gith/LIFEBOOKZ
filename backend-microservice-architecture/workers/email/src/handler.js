import { createDynamoIdempotencyStore, parseQueueBatch } from "@lifebookz/shared-aws";
import { createLogger } from "@lifebookz/shared-logger";

import { config } from "./config.js";
import { parseEmailJob } from "./schema.js";
import { createSesGateway } from "./ses.js";

export const logger = createLogger({
  service: "email-worker",
  functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
});

const realSes = () => createSesGateway({ region: config.sesRegion, logger });

const realIdempotency = () =>
  createDynamoIdempotencyStore({
    table: config.idempotencyTable,
    region: config.region,
    service: "email-worker",
  });

/** A failure that retrying will never fix (bad payload, SES MessageRejected). */
function isPermanent(error) {
  return Boolean(error?.permanent);
}

/**
 * Handler factory — tests inject a fake SES gateway and an in-memory
 * idempotency store; production uses the real ones.
 *
 * Returns `batchItemFailures` (functionResponseType: ReportBatchItemFailures)
 * so only genuinely failed messages are retried; successful ones are deleted
 * by the event source mapping. Failed messages redrive until
 * `maxReceiveCount` (5) and then land in `lifebookz-email-dlq`.
 */
export function createHandler({ sesGateway = realSes(), idempotencyStore = realIdempotency() } = {}) {
  const ses = sesGateway;
  const idempotency = idempotencyStore;

  async function processMessage(record, startedAt) {
    let job;

    try {
      job = parseEmailJob(record.body);
    } catch (error) {
      // Unparseable/invalid: permanent. The messageId is reported as failed so
      // the DLQ eventually captures it after maxReceiveCount attempts.
      logger.failure?.("Email job rejected — invalid payload", error, {
        messageId: record.messageId,
        receiveCount: record.receiveCount,
      });
      return { status: "failed" };
    }

    // Idempotency: a DynamoDB conditional write keyed on the deterministic
    // `jobId`. A redelivered SQS message claims the same key, loses the race,
    // and the email is not sent twice. Records expire after 7 days (TTL).
    let claimed;

    try {
      claimed = await idempotency.claim(job.jobId, {
        eventType: "EmailJob",
        jobId: job.jobId,
        sqsMessageId: record.messageId,
      });
    } catch (error) {
      logger.failure?.("Idempotency store unavailable — message will be retried", error, {
        jobId: job.jobId,
        messageId: record.messageId,
      });
      return { status: "failed" };
    }

    if (!claimed) {
      logger.info?.("Duplicate email job skipped", {
        jobId: job.jobId,
        template: job.template,
        messageId: record.messageId,
      });
      return { status: "duplicate" };
    }

    try {
      await ses.send(job, {
        from: config.fromEmail,
        fromName: config.fromName,
        replyTo: config.replyTo || undefined,
      });

      logger.info?.("Email job processed", {
        jobId: job.jobId,
        template: job.template,
        to: job.to,
        durationMs: Date.now() - startedAt,
      });

      return { status: "processed" };
    } catch (error) {
      // Release the claim so a redelivery is a real retry, not a "duplicate".
      try {
        await idempotency.release(job.jobId);
      } catch (releaseError) {
        logger.warn?.("Idempotency release failed", { jobId: job.jobId, error: releaseError.message });
      }

      logger.failure?.("Email job failed — message will be retried", error, {
        jobId: job.jobId,
        template: job.template,
        to: job.to,
        messageId: record.messageId,
        receiveCount: record.receiveCount,
        permanent: isPermanent(error),
      });

      return { status: "failed" };
    }
  }

  return async function handler(event, context = {}) {
    const startedAt = Date.now();
    const { messages, invalid } = parseQueueBatch(event);

    const summary = { received: messages.length + invalid.length, processed: 0, duplicates: 0, failed: 0 };
    const batchItemFailures = [];

    for (const record of invalid) {
      summary.failed += 1;
      batchItemFailures.push({ itemIdentifier: record.messageId });

      logger.error?.("Unparseable SQS message — routed to DLQ after retries", {
        messageId: record.messageId,
        error: record.error,
      });
    }

    for (const record of messages) {
      const outcome = await processMessage(record, startedAt);

      if (outcome.status === "processed") summary.processed += 1;
      if (outcome.status === "duplicate") summary.duplicates += 1;

      if (outcome.status === "failed") {
        summary.failed += 1;
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }

    logger.info?.("Email batch complete", {
      ...summary,
      durationMs: Date.now() - startedAt,
      requestId: context.awsRequestId,
      service: "email-worker",
    });

    return { batchItemFailures };
  };
}

const handler = createHandler();

export { handler };
export default handler;
