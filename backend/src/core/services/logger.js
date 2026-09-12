import mongoose from "mongoose";

import Log from "../models/log.model.js";

const SERVICE = "lifebookz-api";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_META_JSON_LENGTH = 8000;

const LEVELS = ["debug", "info", "warn", "error"];

function truncate(value, max) {
  const str = typeof value === "string" ? value : String(value ?? "");
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

/**
 * Make meta safe to store: drop anything unserializable (circular refs) and
 * cap the size so a stray huge object can't bloat a log document.
 */
function safeMeta(meta) {
  if (!meta || typeof meta !== "object") return {};

  let json;

  try {
    json = JSON.stringify(meta);
  } catch {
    return { note: "meta could not be serialized" };
  }

  if (!json) return {};

  if (json.length > MAX_META_JSON_LENGTH) {
    return {
      note: "meta truncated",
      preview: json.slice(0, MAX_META_JSON_LENGTH),
    };
  }

  try {
    return JSON.parse(json);
  } catch {
    return { note: "meta could not be parsed" };
  }
}

/**
 * Write one log line.
 *
 * Logging must never break a request, so this never throws: console output is
 * always emitted and the DB write is skipped (with a console warning) when
 * Mongo isn't connected or the insert fails.
 */
async function write(level, message, meta) {
  const entry = {
    level: LEVELS.includes(level) ? level : "info",
    message: truncate(message || "(no message)", MAX_MESSAGE_LENGTH),
    meta: safeMeta(meta),
    service: SERVICE,
    timestamp: new Date(),
  };

  const toConsole =
    entry.level === "error"
      ? console.error
      : entry.level === "warn"
        ? console.warn
        : console.log;

  toConsole(
    `[${entry.level.toUpperCase()}] ${entry.message}`,
    meta && Object.keys(entry.meta).length ? entry.meta : "",
  );

  // Only persist once Mongo is actually connected — during boot, or if the
  // database is down, console output above still gives us visibility.
  if (mongoose.connection.readyState !== 1) return null;

  try {
    return await Log.create(entry);
  } catch (error) {
    console.error("[LOGGER] ⚠ Failed to persist log:", error.message);
    return null;
  }
}

export const logger = {
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};

/**
 * Log a caught error with its stack and any request/job context. Use this in
 * catch blocks that don't surface the error as an HTTP response (workers,
 * SQS jobs, background syncs).
 */
export function logError(error, context = {}) {
  return logger.error(error?.message || "Unknown error", {
    ...context,
    name: error?.name,
    code: error?.code,
    statusCode: error?.statusCode,
    stack: error?.stack,
  });
}

export default logger;
