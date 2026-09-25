import { createEventConsumer } from "@lifebookz/shared-events";
import { createLogger } from "@lifebookz/shared-logger";

import { createSystemEventHandlers } from "../consumers/domain-events.js";
import { ProcessedEvent } from "../models/processed-event.js";
import { getDeps } from "../container.js";

export const logger = createLogger({ service: "system", functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });

/**
 * System's inbound event consumer (EventBridge → SQS → this Lambda).
 *
 * Idempotent through the service's own `processed_events` collection;
 * failures are reported per message so SQS retries only what failed and the
 * DLQ receives only genuinely poisonous messages.
 */
const consumer = createEventConsumer({
  service: "system",
  logger,
  handlers: createSystemEventHandlers({
    reviewQueue: getDeps({ logger }).reviewQueue,
    auditLogs: getDeps({ logger }).auditLogs,
    logger,
  }),
  idempotency: {
    async claim(eventId, meta) {
      try {
        await ProcessedEvent.create({ eventId, ...meta });
        return true;
      } catch (error) {
        if (error?.code === 11000) return false; // duplicate delivery
        throw error;
      }
    },
    async release(eventId) {
      await ProcessedEvent.deleteOne({ eventId });
    },
  },
});

export const handler = async (event, context) => {
  await getDeps({ logger }).ready();

  return consumer.handle(event, context);
};

export default handler;
