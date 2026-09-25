import { createEventConsumer } from "@lifebookz/shared-events";
import { createLogger } from "@lifebookz/shared-logger";

import { getDeps } from "../container.js";

export const logger = createLogger({ service: "consultation", functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });

/**
 * Consultation's inbound event consumer (EventBridge → SQS → this Lambda).
 *
 * Idempotent through the service's own `processed_events` collection; failures
 * are reported per message so SQS retries only what actually failed and the DLQ
 * only receives genuinely poisonous messages.
 */
const consumer = createEventConsumer({
  service: "consultation",
  logger,
  handlers: getDeps({ logger }).eventHandlers,
  idempotency: getDeps({ logger }).processedEvents,
});

export const handler = async (event, context) => {
  await getDeps({ logger }).ready();

  return consumer.handle(event, context);
};

export default handler;
