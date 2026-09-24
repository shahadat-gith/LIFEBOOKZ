import multer from "multer";

/**
 * Attach the error detail to the request so the request logger can persist it
 * as a single structured log entry, then send the standard error response.
 */
function respond(req, res, statusCode, code, message, extra = {}) {
  req.errorContext = {
    code,
    statusCode,
    message,
    ...(extra.fields ? { fields: extra.fields } : {}),
    ...(extra.stack ? { stack: extra.stack } : {}),
  };

  const error = { code, message };
  if (extra.fields) error.fields = extra.fields;
  if (extra.stack) error.stack = extra.stack;

  return res.status(statusCode).json({ success: false, error });
}

export default function errorHandler(err, req, res, _next) {
  // — Multer upload errors —
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return respond(
        req,
        res,
        400,
        "FILE_TOO_LARGE",
        "File size exceeds the allowed limit.",
      );
    }

    return respond(req, res, 400, "UPLOAD_ERROR", err.message);
  }

  // — Mongoose validation errors (use name string for portability) —
  if (err.name === "ValidationError") {
    const fields = {};
    for (const key of Object.keys(err.errors)) {
      fields[key] = err.errors[key].message;
    }

    return respond(
      req,
      res,
      400,
      "VALIDATION_ERROR",
      "Validation failed. Check the fields for details.",
      { fields },
    );
  }

  // — Mongoose duplicate-key errors —
  if (err.name === "MongoServerError" && err.code === 11000) {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0] || "field";
    const message = `An account with this ${field} already exists.`;

    return respond(req, res, 409, "DUPLICATE_FIELD", message, {
      fields: { [field]: message },
    });
  }

  // — Mongoose cast errors (e.g. bad ObjectId) —
  if (err.name === "CastError") {
    return respond(
      req,
      res,
      400,
      "INVALID_ID",
      "Invalid resource identifier.",
    );
  }

  // — Our own app errors — (plain Errors flagged by core/utils/errors.js)
  if (err.isAppError) {
    return respond(req, res, err.statusCode, err.code, err.message, {
      fields: err.fields,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // — Fallback: unknown errors. Always keep the stack for debugging. —
  return respond(
    req,
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred.",
    { stack: err.stack || String(err) },
  );
}
