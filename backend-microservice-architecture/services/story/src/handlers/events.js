import { createEventConsumer } from "@lifebookz/shared-events";
import { createLogger } from "@lifebookz/shared-logger";

import { getDeps } from "../container.js";

export const logger = createLogger({ service: "story", functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });

/**
 * Story's inbound event consumer (EventBridge → SQS → this Lambda).
 *
 * Every handler is idempotent through the service's own `processed_events`
 * collection, and the consumer reports partial batch failures so SQS retries
 * only the messages that failed.
 */
const consumer = createEventConsumer({
  service: "story",
  logger,
  handlers: getDeps({ logger }).eventHandlers,
  idempotency: getDeps({ logger }).processedEvents,
});

export const handler = async (event, context) => {
  await getDeps({ logger }).ready();

  return consumer.handle(event, context);
};

export default handler;
