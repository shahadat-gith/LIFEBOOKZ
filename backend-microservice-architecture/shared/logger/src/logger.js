import { errorInfo, redact, serialize } from "./redact.js";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

/** Fields every Lambda log line carries. */
const REQUIRED_FIELDS = ["requestId", "eventId", "service", "function", "operation", "status"];

/**
 * Structured logger.
 *
 * One JSON object per line on stdout so CloudWatch Logs Insights can query
 * `service`, `operation`, `status`, `duration`, `requestId`, `eventId`,
 * `userId` directly. Nothing sensitive is ever emitted (see redact.js).
 *
 * @param {object} options
 * @param {string} options.service        e.g. "story"
 * @param {string} [options.functionName] Lambda function name
 * @param {object} [options.base]         fields merged into every line
 * @param {object} [options.sink]         defaults to console
 */
export function createLogger({ service, functionName, base = {}, sink = console, level } = {}) {
  const minimum = LEVELS[level || process.env.LOG_LEVEL || "info"] || LEVELS.info;

  function emit(levelName, message, meta) {
    if (LEVELS[levelName] < minimum) return;

    const extra = meta && typeof meta === "object" ? meta : meta === undefined ? {} : { value: meta };

    const entry = {
      level: levelName,
      time: new Date().toISOString(),
      service,
      function: functionName,
      message: redact(message),
      ...redact(base),
      ...redact(extra),
    };

    const line = serialize(entry);
    const toConsole =
      levelName === "error" ? sink.error : levelName === "warn" ? sink.warn : sink.log;

    (toConsole || sink.log).call(sink, line);
  }

  const logger = {
    service,
    functionName,
    level: minimum,
    debug: (message, meta) => emit("debug", message, meta),
    info: (message, meta) => emit("info", message, meta),
    warn: (message, meta) => emit("warn", message, meta),
    error: (message, meta) => emit("error", message, meta),

    /** Log a caught error with its stack (logs only, never a response). */
    failure: (message, error, meta) => emit("error", message, { ...meta, error: errorInfo(error) }),

    /** Child logger with extra bound fields (requestId, userId, …). */
    child(bound) {
      return createLogger({
        service,
        functionName,
        base: { ...base, ...bound },
        sink,
        level,
      });
    },
  };

  return logger;
}

/**
 * Build the request-scoped logger used by the HTTP router.
 * Keeps the field names required by the logging contract in one place.
 */
export function requestLogger(logger, context = {}) {
  return logger.child({
    requestId: context.requestId,
    ...(context.eventId ? { eventId: context.eventId } : {}),
    ...(context.userId ? { userId: context.userId } : {}),
    ...(context.role ? { role: context.role } : {}),
    ...(context.operation ? { operation: context.operation } : {}),
    ...(context.status !== undefined ? { status: context.status } : {}),
    ...(context.duration !== undefined ? { duration: context.duration } : {}),
  });
}

export { errorInfo, redact, serialize, REQUIRED_FIELDS };
