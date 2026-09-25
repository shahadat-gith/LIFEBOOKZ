import { createRouter } from "@lifebookz/shared-aws";
import { createLogger } from "@lifebookz/shared-logger";

import { getDeps } from "../container.js";
import routes from "../routes.js";

export const logger = createLogger({ service: "notification", functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });

/**
 * Notification API Lambda — the inbox read/mutate endpoints.
 *
 * The recipient is always derived from the verified JWT claims (role → account
 * model) plus the account id, so a token can only ever address its own inbox.
 */
const router = createRouter({
  service: "notification",
  routes,
  logger,
  failurePublisher: getDeps({ logger }).publisher,
  createDeps: async () => getDeps({ logger }),
});

export const handler = (event, context) => router.handler(event, context);

export default handler;
