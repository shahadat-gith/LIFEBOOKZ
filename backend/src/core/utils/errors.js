/**
 * Error factories.
 *
 * Every expected failure is a plain Error carrying the HTTP status and a
 * stable machine-readable code. The error handler reads only those two
 * fields, so a new failure kind never has to touch the handler.
 */

function appError(message, statusCode, code, fields) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.isAppError = true;
  if (fields) error.fields = fields;
  return error;
}

export const notFoundError = (message = "Resource not found") =>
  appError(message, 404, "NOT_FOUND");

export const validationError = (message = "Validation failed") =>
  appError(message, 422, "VALIDATION_ERROR");

/**
 * `fields` names the offending form input (`{ password: "…" }`) so a client can
 * mark that input as well as show the message.
 */
export const authenticationError = (
  message = "Authentication required",
  fields,
) => appError(message, 401, "AUTHENTICATION_ERROR", fields);

export const authorizationError = (message = "Insufficient permissions") =>
  appError(message, 403, "AUTHORIZATION_ERROR");

export const forbiddenError = (message = "Access forbidden") =>
  appError(message, 403, "FORBIDDEN");

export const conflictError = (message = "Resource already exists", fields) =>
  appError(message, 409, "CONFLICT_ERROR", fields);

export const serviceUnavailableError = (
  message = "Service temporarily unavailable",
) => appError(message, 503, "SERVICE_UNAVAILABLE");

export const storageError = (
  message = "File storage is unavailable. Please try again later.",
) => appError(message, 502, "STORAGE_ERROR");
