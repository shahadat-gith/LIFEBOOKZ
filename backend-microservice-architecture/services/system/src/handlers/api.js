import { createRouter } from "@lifebookz/shared-aws";
import { createLogger } from "@lifebookz/shared-logger";

import { getDeps } from "../container.js";
import routes from "../routes.js";

export const logger = createLogger({ service: "system", functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });

/**
 * System API Lambda (admin + developer portals).
 *
 * API Gateway validated the JWT; the router re-checks the admin/developer
 * role on every route. Privileged actions additionally land in the audit log
 * inside the handlers.
 */
const router = createRouter({
  service: "system",
  routes,
  logger,
  failurePublisher: getDeps({ logger }).publisher,
  createDeps: async () => getDeps({ logger }),
});

export const handler = (event, context) => router.handler(event, context);

export default handler;
