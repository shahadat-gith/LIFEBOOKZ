import multer from "multer";
import { AppError } from "../utils/errors.js";

export default function errorHandler(err, req, res, _next) {
  // — Multer upload errors —
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      err = new AppError("File size exceeds the allowed limit.", 400, "FILE_TOO_LARGE");
    } else {
      err = new AppError(err.message, 400, "UPLOAD_ERROR");
    }
  }

  // — Mongoose validation errors (use name string for portability) —
  if (err.name === "ValidationError") {
    const fields = {};
    for (const key of Object.keys(err.errors)) {
      fields[key] = err.errors[key].message;
    }
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed. Check the fields for details.",
        fields,
      },
    });
  }

  // — Mongoose duplicate-key errors —
  if (err.name === "MongoServerError" && err.code === 11000) {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0] || "field";
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_FIELD",
        message: `An account with this ${field} already exists.`,
      },
    });
  }

  // — Mongoose cast errors (e.g. bad ObjectId) —
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: "Invalid resource identifier.",
      },
    });
  }

  // — Our own AppError instances —
  if (err instanceof AppError) {
    const response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    if (process.env.NODE_ENV === "development") {
      response.error.stack = err.stack;
    }
    return res.status(err.statusCode).json(response);
  }

  // — Fallback: unknown errors —
  console.error("[Unhandled Error]", err);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
}