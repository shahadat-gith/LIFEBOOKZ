import { createIdempotencyGuard } from "./idempotency.js";
import { isKnownEventType } from "./registry.js";

/**
 * Unwrap one `records[]` entry of an SQS event.
 *
 * The body is the EventBridge event as JSON; our envelope lives in `detail`.
 * Throwing here means "unparseable message" — the caller decides whether that
 * is a permanent failure (→ DLQ) or a retryable one.
 */
export function unwrapSqsRecord(record) {
  const eventBridgeEvent = JSON.parse(record.body);
  const detail =
    typeof eventBridgeEvent.detail === "string"
      ? JSON.parse(eventBridgeEvent.detail)
      : eventBridgeEvent.detail;

  return {
    ...detail,
    envelopeVersion: detail?.envelopeVersion,
    bridge: {
      id: eventBridgeEvent.id,
      source: eventBridgeEvent.source,
      detailType: eventBridgeEvent["detail-type"],
      time: eventBridgeEvent.time,
      ruleArn: eventBridgeEvent["rule-arn"],
    },
    sqs: {
      messageId: record.messageId,
      receiveCount: Number(record.attributes?.ApproximateReceiveCount || 1),
    },
  };
}

/** Parse a whole SQS batch, separating unparseable messages. */
export function parseSqsBatch(event) {
  const records = event?.Records || [];
  const events = [];
  const invalid = [];

  for (const record of records) {
    try {
      events.push(unwrapSqsRecord(record));
    } catch (error) {
      invalid.push({ messageId: record.messageId, error: error.message });
    }
  }

  return { events, invalid, records };
}

/**
 * Build a consumer for one service.
 *
 * @param {object} options
 * @param {Record<string, (event: object, ctx: object) => Promise<void>>} options.handlers
 *        keyed by `eventType`.
 * @param {object} options.idempotency  persistent store ({claim, release})
 * @param {object} options.logger
 */
export function createEventConsumer({ handlers = {}, idempotency, logger, service } = {}) {
  const guard = createIdempotencyGuard({ store: idempotency, logger });

  async function dispatch(event, { deps } = {}) {
    const { eventType, eventId } = event;

    const handler = handlers[eventType];

    if (!handler) {
      // Unknown types are not failures: a consumer only subscribes to the
      // detail types it declared in its EventBridge rule, but an added event
      // type must never poison the queue.
      logger?.debug?.("No handler for event type", { eventType, eventId });
      return { status: "unhandled" };
    }

    if (event.bridge?.detailType && event.bridge.detailType !== eventType) {
      throw new Error(
        `Event envelope/EventBridge mismatch: detail-type "${event.bridge.detailType}" vs eventType "${eventType}".`,
      );
    }

    return guard.run({
      eventId,
      eventType,
      meta: { source: event.source, sqsMessageId: event.sqs?.messageId },
      handler: () => handler(event, { deps, logger: logger?.child?.({ eventId, eventType }) || logger }),
    });
  }

  /**
   * Standard Lambda entry point for an SQS event source.
   *
   * Returns `batchItemFailures` so SQS retries only the messages that failed
   * (configure `functionResponseType: ReportBatchItemFailures`). Unparseable
   * messages are reported as failures too, which is what eventually moves them
   * to the DLQ after `maxReceiveCount`.
   */
  async function handle(event, context = {}) {
    const { events, invalid } = parseSqsBatch(event);
    const batchItemFailures = invalid.map((item) => ({ itemIdentifier: item.messageId }));
    const summary = { received: events.length + invalid.length, processed: 0, duplicates: 0, unhandled: 0, failed: 0 };

    for (const item of invalid) {
      summary.failed += 1;
      logger?.error?.("Unparseable SQS message routed to the DLQ", {
        messageId: item.messageId,
        error: item.error,
      });
    }

    for (const domainEvent of events) {
      try {
        const outcome = await dispatch(domainEvent, context);

        if (outcome.status === "processed") summary.processed += 1;
        if (outcome.status === "duplicate") summary.duplicates += 1;
        if (outcome.status === "unhandled") summary.unhandled += 1;
      } catch (error) {
        summary.failed += 1;
        batchItemFailures.push({ itemIdentifier: domainEvent.sqs.messageId });
        logger?.failure?.("Event handling failed — message will be retried", error, {
          eventId: domainEvent.eventId,
          eventType: domainEvent.eventType,
          sqsMessageId: domainEvent.sqs.messageId,
          receiveCount: domainEvent.sqs.receiveCount,
        });
      }
    }

    logger?.info?.("Event batch handled", { ...summary, requestId: context?.awsRequestId, service });

    return { batchItemFailures };
  }

  return { handle, dispatch, handlers, isKnownEventType };
}
