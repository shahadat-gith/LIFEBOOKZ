import { createRouter } from "@lifebookz/shared-aws";
import { createLogger } from "@lifebookz/shared-logger";

import { getDeps } from "../container.js";
import routes from "../routes.js";

export const logger = createLogger({ service: "story", functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });

/**
 * Story API Lambda.
 *
 * API Gateway has already validated the JWT for protected routes; this handler
 * reads the claims and then decides resource authorization (owner, author,
 * admin) inside the domain services.
 */
const router = createRouter({
  service: "story",
  routes,
  logger,
  failurePublisher: getDeps({ logger }).publisher,
  createDeps: async () => getDeps({ logger }),
});

export const handler = (event, context) => router.handler(event, context);

export default handler;
