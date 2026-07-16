import { AppError } from '../utils/errors.js';
import log from '../utils/logger.js';

export default function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    log('error', 'Server error', {
      code,
      message: err.message,
      path: req.path,
      method: req.method,
      requestId: req.id,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  res.status(statusCode).json({
    type: `/errors/${code.toLowerCase()}`,
    title: code,
    status: statusCode,
    detail: err.isOperational ? err.message : 'An unexpected error occurred',
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
