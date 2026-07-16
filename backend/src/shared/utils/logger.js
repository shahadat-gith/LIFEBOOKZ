import Log from "../models/logger.js";

export default async function log(level, message, meta = {}) {
  try {
    await Log.create({ level, message, meta });
  } catch (err) {
    // Fallback to console if database logging fails
    const prefix = `[${level.toUpperCase()}]`;
    if (level === 'error') console.error(prefix, message, meta, err.message);
    else if (level === 'warn') console.warn(prefix, message, meta);
    else console.log(prefix, message, meta);
  }
}

export { Log };
