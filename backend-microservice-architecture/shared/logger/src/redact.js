/**
 * Keys whose values must never reach CloudWatch.
 *
 * The existing backend had to be careful not to persist OTP values, tokens or
 * credentials; here the redaction is central so a new call site cannot leak
 * them by accident.
 */
const SENSITIVE_KEY_PATTERN =
  /(password|passwd|pwd|otp|token|secret|authorization|cookie|apikey|api_key|accesskey|privatekey|private_key|signature|credential|jwt|salt|hash)/i;

export const REDACTED = "[redacted]";

/** Value-aware redaction (a bare secret string in a `message` field). */
const SENSITIVE_VALUE_PATTERN =
  /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g;

const MAX_STRING = 2000;
const MAX_DEPTH = 6;
const MAX_KEYS = 60;
const MAX_JSON = 16000;

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function redactString(value) {
  const text = String(value);

  return text.length > MAX_STRING
    ? `${text.slice(0, MAX_STRING)}…[truncated]`
    : text;
}

/**
 * Return a log-safe copy of `input`.
 *
 * - sensitive keys are replaced by `[redacted]`
 * - JWT-looking strings are masked
 * - depth, key count and total size are bounded so one stray object cannot
 *   bloat a log line
 * - circular references are described instead of throwing
 */
export function redact(input, depth = 0) {
  if (input === null || input === undefined) return input;

  if (typeof input === "string") return redactString(input).replace(SENSITIVE_VALUE_PATTERN, REDACTED);
  if (typeof input === "number" || typeof input === "boolean") return input;
  if (typeof input === "bigint") return String(input);
  if (typeof input === "function") return "[function]";
  if (input instanceof Date) return input.toISOString();
  if (input instanceof Error) return errorInfo(input);

  if (depth >= MAX_DEPTH) return "[max-depth]";
  if (Array.isArray(input)) {
    return input.slice(0, MAX_KEYS).map((item) => redact(item, depth + 1));
  }

  if (isPlainObject(input)) {
    const output = {};
    let count = 0;

    for (const [key, value] of Object.entries(input)) {
      if (count >= MAX_KEYS) break;
      count += 1;
      output[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(value, depth + 1);
    }

    return output;
  }

  // Buffers, streams, class instances …
  return `[${input?.constructor?.name || typeof input}]`;
}

/** Error → loggable object. The stack stays internal (logs only). */
export function errorInfo(error) {
  if (!error) return {};

  return {
    name: error.name,
    message: redactString(error.message || String(error)),
    code: error.code,
    statusCode: error.statusCode,
    cause: error.cause?.message,
    stack: error.stack,
  };
}

/** Final size guard so a log line stays parseable. */
export function serialize(entry) {
  let json;

  try {
    json = JSON.stringify(entry);
  } catch {
    return JSON.stringify({ level: "error", message: "log serialization failed" });
  }

  if (json.length <= MAX_JSON) return json;

  return JSON.stringify({
    level: entry.level,
    time: entry.time,
    service: entry.service,
    function: entry.function,
    message: entry.message,
    truncated: true,
    preview: json.slice(0, MAX_JSON),
  });
}
