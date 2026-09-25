import { SendMessageCommand } from "@aws-sdk/client-sqs";

import { upstreamError } from "@lifebookz/shared-errors";

import { getSqsClient } from "./clients.js";

/**
 * Send work items to a queue.
 *
 * Used by services that hand a job to a worker instead of doing the work in
 * the request (email today). The payload is JSON with a `jobId`, which is what
 * makes the worker idempotent: a redelivered message carries the same id, so
 * the worker's conditional idempotency write rejects it.
 */
export function createQueueSender({ queueUrl, region, client, logger, service } = {}) {
  const target = () => queueUrl || process.env.SQS_EMAIL_QUEUE_URL;

  async function send(payload) {
    const url = target();

    if (!url) throw upstreamError("No queue URL configured — cannot enqueue work.");

    await getSqsClient({ region, client }).send(
      new SendMessageCommand({
        QueueUrl: url,
        MessageBody: JSON.stringify(payload),
        // Content-based dedupe is a FIFO feature; standard queues rely on the
        // worker's idempotency record instead (see the README section on DLQs).
        ...(service ? { MessageAttributes: { service: { DataType: "String", StringValue: service } } } : {}),
      }),
    );

    logger?.debug?.("Work item queued", { jobId: payload?.jobId, type: payload?.type, service });

    return payload;
  }

  /**
   * Queue without ever breaking the caller's transaction.
   *
   * Booking a consultation must succeed even if SQS is unavailable; the failure
   * is logged and the caller carries on. This mirrors the existing backend's
   * `sendEmailSafely`.
   */
  async function sendSafely(payload) {
    try {
      return await send(payload);
    } catch (error) {
      logger?.warn?.("Queueing work item failed", { jobId: payload?.jobId, type: payload?.type, error: error.message });

      return null;
    }
  }

  return { send, sendSafely, queueUrl: target };
}

/**
 * Parse an SQS Lambda event.
 *
 * Returns the parsed messages plus the ones whose body is not valid JSON. The
 * caller decides what an unparseable message means (for a worker it is a
 * permanent failure and must be reported as a batch item failure so the DLQ
 * eventually catches it — never silently deleted).
 */
export function parseQueueBatch(event) {
  const records = event?.Records || [];
  const messages = [];
  const invalid = [];

  for (const record of records) {
    const meta = {
      messageId: record.messageId,
      // Event source mapping attributes are optional; default to the first
      // attempt so a missing attribute never looks like a poison message.
      receiveCount: Number(record.attributes?.ApproximateReceiveCount || 1),
      sentAt: record.attributes?.SentTimestamp ? new Date(Number(record.attributes.SentTimestamp)) : null,
    };

    try {
      messages.push({ ...meta, body: JSON.parse(record.body) });
    } catch (error) {
      invalid.push({ ...meta, error: error.message, raw: record.body });
    }
  }

  return { messages, invalid, records };
}
