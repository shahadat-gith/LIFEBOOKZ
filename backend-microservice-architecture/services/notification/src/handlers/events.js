import { createEventConsumer } from "@lifebookz/shared-events";
import { createLogger } from "@lifebookz/shared-logger";

import { getDeps } from "../container.js";

export const logger = createLogger({ service: "notification", functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });

/**
 * The heart of the service: EventBridge → SQS → this consumer.
 *
 * Idempotency is enforced twice on purpose:
 *  1. `processed_events` (unique `eventId`) stops the same event being handled
 *     twice;
 *  2. every notification row carries a deterministic `dedupeKey` and every email
 *     job a deterministic `jobId`, so even a partial failure that is retried
 *     cannot duplicate a recipient-visible effect.
 */
const consumer = createEventConsumer({
  service: "notification",
  logger,
  handlers: getDeps({ logger }).eventHandlers,
  idempotency: getDeps({ logger }).processedEvents,
});

export const handler = async (event, context) => {
  await getDeps({ logger }).ready();

  return consumer.handle(event, context);
};

export default handler;
