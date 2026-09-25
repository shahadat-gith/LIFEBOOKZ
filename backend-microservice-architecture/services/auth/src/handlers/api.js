import { createRouter } from "@lifebookz/shared-aws";
import { createLogger } from "@lifebookz/shared-logger";

import { getDeps } from "../container.js";
import routes from "../routes.js";

/**
 * Auth Lambda (API) entry point.
 *
 * Every request is JWT-validated by API Gateway's authorizer *before* this
 * handler runs, so the handler only reads claims — it never verifies a token.
 * The two `/.well-known/*` routes are public on purpose: the authorizer has to
 * read them.
 */
export const logger = createLogger({
  service: "auth",
  functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
});

const router = createRouter({
  service: "auth",
  routes,
  logger,
  failurePublisher: getDeps({ logger }).publisher,
  createDeps: async () => getDeps({ logger }),
});

export const handler = (event, context) => router.handler(event, context);

export default handler;
