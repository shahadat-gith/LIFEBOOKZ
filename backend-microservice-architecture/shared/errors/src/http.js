import { normalizeError } from "./errors.js";
import { STATUS_BY_CODE } from "./codes.js";

/**
 * Turn any thrown value into the API's single error response shape:
 *
 *   { success: false, error: { code, message, fields?, requestId } }
 *
 * This is byte-compatible with the monolith's error handler, so the existing
 * frontends keep working. Stack traces are logged, never returned.
 */
export function toErrorResponse(error, { requestId, service, logger, context } = {}) {
  const normalized = normalizeError(error);
  const statusCode = normalized.statusCode || STATUS_BY_CODE[normalized.code] || 500;

  const body = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
    },
  };

  if (normalized.fields) body.error.fields = normalized.fields;
  if (normalized.details?.retryAfterSeconds) {
    body.error.retryAfterSeconds = normalized.details.retryAfterSeconds;
  }
  if (requestId) body.error.requestId = requestId;

  // 5xx is a bug or infrastructure failure: log it with the stack. 4xx is an
  // expected outcome and is logged at warn without a stack.
  const log = logger || console;
  const meta = {
    service,
    requestId,
    statusCode,
    code: normalized.code,
    ...(context || {}),
  };

  if (statusCode >= 500) {
    const write = log.error || log.warn || console.error;
    write.call(log, normalized.message, {
      ...meta,
      name: error?.name,
      cause: error?.cause?.message,
      stack: error?.stack,
    });
  } else {
    const write = log.warn || console.warn;
    write.call(log, normalized.message, meta);
  }

  return { statusCode, body };
}
