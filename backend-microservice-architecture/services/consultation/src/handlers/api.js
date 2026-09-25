import { createRouter } from "@lifebookz/shared-aws";
import { createLogger } from "@lifebookz/shared-logger";

import { getDeps } from "../container.js";
import routes from "../routes.js";

export const logger = createLogger({ service: "consultation", functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });

/**
 * Consultation API Lambda.
 *
 * API Gateway validated the JWT; the router re-checks the coarse role, and the
 * domain services decide resource authorization (the client who booked it, the
 * expert it was addressed to).
 */
const router = createRouter({
  service: "consultation",
  routes,
  logger,
  failurePublisher: getDeps({ logger }).publisher,
  createDeps: async () => getDeps({ logger }),
});

export const handler = (event, context) => router.handler(event, context);

export default handler;
