import { randomUUID } from "node:crypto";

import {
  authenticationError,
  authorizationError,
  badRequestError,
  payloadTooLargeError,
  toErrorResponse,
} from "@lifebookz/shared-errors";
import { createLogger } from "@lifebookz/shared-logger";
import { readClaims } from "@lifebookz/shared-auth";

export const DEFAULT_MAX_BODY_BYTES = 1_000_000; // 1 MB of JSON

/** API Gateway HTTP API v2 proxy event helpers. */
export function methodOf(event) {
  return (event?.requestContext?.http?.method || event?.httpMethod || "GET").toUpperCase();
}

export function rawPathOf(event) {
  return event?.rawPath || event?.requestContext?.http?.path || event?.path || "/";
}

export function queryOf(event) {
  return event?.queryStringParameters || {};
}

export function headersOf(event) {
  return event?.headers || {};
}

export function headerOf(event, name) {
  const headers = headersOf(event);
  const lower = String(name).toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }

  return undefined;
}

export function requestIdOf(event, context) {
  return (
    event?.requestContext?.requestId ||
    context?.awsRequestId ||
    headerOf(event, "x-request-id") ||
    randomUUID()
  );
}

export function jsonResponse(statusCode, body, { headers } = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

/** Parse a JSON request body with a size guard (API Gateway allows 10 MB). */
export function parseJsonBody(event, { maxBytes = DEFAULT_MAX_BODY_BYTES } = {}) {
  const raw = event?.body;

  if (raw === undefined || raw === null || raw === "") return {};

  const size = Buffer.byteLength(raw, event?.isBase64Encoded ? "base64" : "utf8");
  if (size > maxBytes) {
    throw payloadTooLargeError(`Request body must be ${Math.floor(maxBytes / 1000)} KB or smaller.`);
  }

  const text = event.isBase64Encoded ? Buffer.from(raw, "base64").toString("utf8") : raw;

  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw badRequestError("Request body must be a JSON object.");
    }

    return parsed;
  } catch (error) {
    if (error.isAppError) throw error;
    throw badRequestError("Request body must be valid JSON.");
  }
}

function splitPath(path) {
  return String(path)
    .split("?")[0]
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

/** Match a route template (`/api/v1/stories/{storyId}`) against a request path. */
export function matchPath(template, path) {
  const expected = splitPath(template);
  const actual = splitPath(path);

  if (expected.length !== actual.length) return null;

  const params = {};

  for (let index = 0; index < expected.length; index += 1) {
    const segment = expected[index];
    const value = actual[index];

    if (segment.startsWith("{") && segment.endsWith("}")) {
      params[segment.slice(1, -1)] = value;
      continue;
    }

    if (segment !== value) return null;
  }

  return params;
}

const PUBLIC = "public";
const AUTHENTICATED = "authenticated";

function accessRule(access) {
  if (!access || access === PUBLIC) return { level: PUBLIC, roles: null };

  if (Array.isArray(access)) return access.length === 0 ? { level: AUTHENTICATED, roles: null } : { level: AUTHENTICATED, roles: access };

  if (access === AUTHENTICATED) return { level: AUTHENTICATED, roles: null };

  if (typeof access === "object" && Array.isArray(access.roles)) {
    return { level: AUTHENTICATED, roles: access.roles.length > 0 ? access.roles : null };
  }

  throw new Error(`Unsupported route access rule: ${JSON.stringify(access)}`);
}

/**
 * Build the Lambda HTTP handler for one service.
 *
 * Responsibilities kept in one place so every service behaves identically:
 *  - route matching (params extracted from `rawPath`, not only from
 *    `pathParameters`, so a proxy route behaves the same as an explicit one)
 *  - defence-in-depth auth/role checks on top of the API Gateway JWT authorizer
 *  - structured request logging (`requestId`, `operation`, `status`, `duration`)
 *  - consistent success/error envelopes
 *  - best-effort `RequestFailed` event for the developer portal's log store
 *
 * @param {object} options
 * @param {string} options.service
 * @param {Array<object>} options.routes
 * @param {(ctx: object) => object|Promise<object>} [options.createDeps]
 * @param {object} [options.logger]
 * @param {object} [options.failurePublisher]  publisher used for `RequestFailed`
 * @param {(ctx: object) => Promise<boolean>} [options.authorize]
 *        optional service-level hook for extra authorization
 * @param {number} [options.maxBodyBytes]
 */
export function createRouter({
  service,
  routes = [],
  createDeps,
  logger,
  failurePublisher,
  authorize,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
} = {}) {
  if (!service) throw new Error("createRouter requires a service name");

  const baseLogger = logger || createLogger({ service, functionName: process.env.AWS_LAMBDA_FUNCTION_NAME });
  const compiled = routes.map((route) => ({ ...route, access: accessRule(route.access) }));

  function findRoute(method, path) {
    const methodNotAllowed = [];

    for (const route of compiled) {
      const params = matchPath(route.path, path);
      if (!params) continue;

      if (route.method.toUpperCase() === method) return { route, params };

      methodNotAllowed.push(route.method);
    }

    return { route: null, params: null, methodNotAllowed };
  }

  async function handle(event, context = {}) {
    const startedAt = process.hrtime.bigint();
    const requestId = requestIdOf(event, context);
    const method = methodOf(event);
    const path = rawPathOf(event);
    const claims = readClaims(event);
    const log = baseLogger.child({
      requestId,
      route: path,
      method,
      ...(claims?.accountId ? { userId: claims.accountId } : {}),
      ...(claims?.role ? { role: claims.role } : {}),
    });

    const { route, params, methodNotAllowed } = findRoute(method, path);

    if (!route) {
      const status = methodNotAllowed?.length ? 405 : 404;
      const response = jsonResponse(status, {
        success: false,
        error: {
          code: status === 405 ? "METHOD_NOT_ALLOWED" : "NOT_FOUND",
          message: status === 405 ? "Method not allowed for this route." : "Route not found.",
          requestId,
        },
      });

      log.warn("Unmatched request", { status, allowed: methodNotAllowed, service });

      return response;
    }

    const operation = route.operation || `${method} ${route.path}`;
    const operationLog = log.child({ operation });

    try {
      if (route.access.level === AUTHENTICATED && !claims) {
        // The API Gateway JWT authorizer should have rejected this already.
        // Reaching here means a route was published without its authorizer.
        const response = toErrorResponse(authenticationError(), {
          requestId,
          service,
          logger: operationLog.child({ status: 401 }),
        });

        return jsonResponse(response.statusCode, response.body);
      }

      if (route.access.roles && !route.access.roles.includes(claims?.role)) {
        const response = toErrorResponse(authorizationError(), {
          requestId,
          service,
          logger: operationLog.child({ status: 403 }),
        });

        return jsonResponse(response.statusCode, response.body);
      }

      const ctx = {
        service,
        operation,
        requestId,
        event,
        context,
        params: params || {},
        query: queryOf(event),
        headers: headersOf(event),
        body: maxBodyBytes > 0 ? parseJsonBody(event, { maxBytes: maxBodyBytes }) : {},
        claims,
        actor: claims ? { accountId: claims.accountId, role: claims.role } : null,
        correlationId: requestId,
        logger: operationLog,
        deps: createDeps ? await createDeps({ event, context, claims, requestId }) : {},
      };

      if (authorize) {
        const allowed = await authorize(ctx);
        if (!allowed) {
          throw authorizationError("You do not have permission to perform this action.");
        }
      }

      const result = await route.handler(ctx);

      if (result && typeof result === "object" && typeof result.statusCode === "number") {
        return result; // raw passthrough (already a Lambda response)
      }

      const status = result?.status || 200;
      const body = { success: true };

      if (result?.data !== undefined) body.data = result.data;
      if (result?.message) body.message = result.message;

      const duration = Number(process.hrtime.bigint() - startedAt) / 1e6;
      operationLog.info("Request completed", { status, duration: Math.round(duration), service });

      return jsonResponse(status, body, { headers: result?.headers });
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const response = toErrorResponse(error, {
        requestId,
        service,
        logger: operationLog.child({ status: error?.statusCode || 500 }),
        context: { duration: Math.round(duration), operation, method, route: path },
      });

      // The existing developer portal reads failures from a log store; keep
      // feeding it, but never let analytics/logging break the response.
      if (failurePublisher) {
        try {
          await failurePublisher.publishSafely({
            type: "RequestFailed",
            data: {
              requestId,
              route: path,
              method,
              operation,
              statusCode: response.statusCode,
              code: response.body?.error?.code,
              message: response.body?.error?.message,
              role: claims?.role || "anonymous",
              accountId: claims?.accountId || null,
              durationMs: Math.round(duration),
              stack: response.statusCode >= 500 ? error?.stack : undefined,
            },
            actor: ctx_actor(claims),
          });
        } catch (publishError) {
          operationLog.warn("Failure event could not be published", {
            error: publishError?.message,
            status: response.statusCode,
          });
        }
      }

      return jsonResponse(response.statusCode, response.body);
    }
  }

  return { handler: handle, findRoute, routes: compiled, service };
}

function ctx_actor(claims) {
  return claims ? { accountId: claims.accountId, role: claims.role } : null;
}
