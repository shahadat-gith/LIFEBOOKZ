import { ERROR_CODES, STATUS_BY_CODE } from "./codes.js";

/**
 * Error factories.
 *
 * Same convention as the existing backend (`core/utils/errors.js`): every
 * expected failure is a plain `Error` carrying `statusCode`, a stable `code`,
 * `isAppError = true` and an optional `fields` map naming the offending input.
 * Callers therefore never construct `Error` by hand and the HTTP layer only
 * has to read two fields.
 */
export function appError(message, code, { fields, statusCode, cause, details } = {}) {
  const error = new Error(message);

  error.code = code;
  error.statusCode = statusCode || STATUS_BY_CODE[code] || 500;
  error.isAppError = true;

  if (fields) error.fields = fields;
  if (details) error.details = details;
  if (cause) error.cause = cause;

  return error;
}

export const badRequestError = (message = "Bad request", options) =>
  appError(message, ERROR_CODES.BAD_REQUEST, options);

export const validationError = (message = "Validation failed", options) =>
  appError(message, ERROR_CODES.VALIDATION_ERROR, options);

/** `fields: { password: "…" }` lets a client mark that input as invalid. */
export const authenticationError = (message = "Authentication required", fields) =>
  appError(message, ERROR_CODES.AUTHENTICATION_ERROR, { fields });

export const authorizationError = (message = "Insufficient permissions") =>
  appError(message, ERROR_CODES.AUTHORIZATION_ERROR);

/**
 * Resource-level denial ("you may not touch this document"), as opposed to the
 * role-level `authorizationError`. The existing backend distinguishes the two
 * the same way, and the frontends switch on `error.code`.
 */
export const forbiddenError = (message = "Access forbidden") =>
  appError(message, ERROR_CODES.FORBIDDEN);

export const notFoundError = (message = "Resource not found") =>
  appError(message, ERROR_CODES.NOT_FOUND);

export const conflictError = (message = "Resource already exists", fields) =>
  appError(message, ERROR_CODES.CONFLICT_ERROR, { fields, statusCode: 409 });

export const duplicateFieldError = (field, message) =>
  appError(
    message || `An account with this ${field} already exists.`,
    ERROR_CODES.DUPLICATE_FIELD,
    { fields: { [field]: message || `Already in use: ${field}` } },
  );

export const payloadTooLargeError = (message = "Request payload is too large") =>
  appError(message, ERROR_CODES.PAYLOAD_TOO_LARGE);

export const tooManyRequestsError = (
  message = "Too many requests. Please try again later.",
  { retryAfterSeconds } = {},
) =>
  appError(message, ERROR_CODES.TOO_MANY_REQUESTS, {
    details: retryAfterSeconds ? { retryAfterSeconds } : undefined,
  });

export const serviceUnavailableError = (message = "Service temporarily unavailable") =>
  appError(message, ERROR_CODES.SERVICE_UNAVAILABLE);

export const upstreamError = (message = "Upstream dependency failed", cause) =>
  appError(message, ERROR_CODES.UPSTREAM_ERROR, { cause });

export const storageError = (
  message = "File storage is unavailable. Please try again later.",
) => appError(message, ERROR_CODES.STORAGE_ERROR);

export const internalError = (message = "An unexpected error occurred.") =>
  appError(message, ERROR_CODES.INTERNAL_SERVER_ERROR);

/**
 * Normalise anything thrown by application code into a client-safe error.
 *
 * Unknown errors are *never* leaked verbatim: the caller keeps the original
 * for logging while the client receives a generic 500.
 */
export function normalizeError(error) {
  if (error?.isAppError) return error;

  // Mongoose duplicate key
  if (error?.name === "MongoServerError" && error?.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    return duplicateFieldError(field);
  }

  // Mongoose schema validation
  if (error?.name === "ValidationError" && error.errors) {
    const fields = {};
    for (const key of Object.keys(error.errors)) {
      fields[key] = error.errors[key].message;
    }

    return validationError("Validation failed. Check the fields for details.", {
      fields,
      cause: error,
    });
  }

  // Mongoose cast (bad ObjectId, etc.)
  if (error?.name === "CastError") {
    return badRequestError("Invalid resource identifier.", { cause: error });
  }

  if (error?.name === "MongoNetworkError" || error?.name === "MongoServerSelectionError") {
    return serviceUnavailableError("The database is temporarily unavailable.", {
      cause: error,
    });
  }

  return internalError();
}

export const isAppError = (error) => Boolean(error?.isAppError);
