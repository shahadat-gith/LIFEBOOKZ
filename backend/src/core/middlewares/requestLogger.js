import { logger } from "../services/logger.js";

/**
 * Request-failure logger.
 *
 * Successful responses are ignored; every request that ends in a 4xx is
 * recorded as a warning and every 5xx as an error, together with the route,
 * duration, caller role and any error context attached by the error handler.
 * That gives the developer portal one record per failing route without a
 * logging call in every controller.
 */
export default function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const statusCode = res.statusCode;

    // Only failures are logged.
    if (statusCode < 400) return;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const errorContext = req.errorContext || {};

    const path = req.originalUrl || req.url || "";

    const context = {
      method: req.method,
      path,
      statusCode,
      durationMs: Math.round(durationMs),
      ip: req.ip,
      role: req.role || "anonymous",
      accountId: req.user?.id ? String(req.user.id) : null,
      userAgent: req.get?.("user-agent") || "",
      ...errorContext,
    };

    const message = `${req.method} ${path} → ${statusCode}${
      errorContext.code ? ` (${errorContext.code})` : ""
    }`;

    if (statusCode >= 500) {
      logger.error(message, context);
    } else {
      logger.warn(message, context);
    }
  });

  next();
}
