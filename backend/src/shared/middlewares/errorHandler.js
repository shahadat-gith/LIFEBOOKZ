import multer from "multer";
import { AppError } from "../utils/errors.js";

export default function errorHandler(err, req, res, _next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      err = new AppError("File size exceeds the allowed limit.", 400, "FILE_TOO_LARGE");
    } else {
      err = new AppError(err.message, 400, "UPLOAD_ERROR");
    }
  }

  if (!(err instanceof AppError)) {
    console.error(err);

    err = new AppError(
      "An unexpected error occurred.",
      500,
      "INTERNAL_SERVER_ERROR"
    );
  }

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