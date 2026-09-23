import config from "../../core/config/index.js";
import Log from "../../core/models/log.model.js";

import { generateToken } from "../../core/utils/helpers.js";
import { authenticationError } from "../../core/utils/errors.js";
import { logger } from "../../core/services/logger.js";

const LOG_LEVELS = ["debug", "info", "warn", "error"];
const MAX_PAGE_SIZE = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Developer login is opt-in via env; until both values are set the portal is
 * effectively disabled.
 */
export function isDeveloperConfigured() {
  return Boolean(config.developer.email && config.developer.password);
}

/**
 * Verifies the env credentials and issues a developer token.
 */
export async function authenticateDeveloper({ email, password, ip }) {
  if (!isDeveloperConfigured()) {
    throw authenticationError(
      "Developer access is not configured on this server.",
    );
  }

  if (email !== config.developer.email || password !== config.developer.password) {
    // Failed privileged logins are exactly the kind of event worth keeping.
    await logger.warn("Developer login failed", {
      email: email ? String(email).slice(0, 120) : null,
      ip,
    });

    throw authenticationError("Invalid developer credentials.");
  }

  const token = generateToken({ role: "developer" });

  await logger.info("Developer logged in", { email, ip });

  return token;
}

/**
 * The single developer identity (there is exactly one, from env).
 */
export function getDeveloperIdentity() {
  return { email: config.developer.email, role: "developer" };
}

/**
 * Filterable, paginated view of application logs.
 */
export async function listLogs(query = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), MAX_PAGE_SIZE);
  const page = Math.max(Number(query.page) || 1, 1);

  const filter = {};

  if (query.level && LOG_LEVELS.includes(query.level)) {
    filter.level = query.level;
  }

  if (query.search?.trim()) {
    const rx = new RegExp(escapeRegex(query.search.trim()), "i");
    filter.$or = [
      { message: rx },
      { "meta.path": rx },
      { "meta.email": rx },
      { "meta.stack": rx },
    ];
  }

  const timestamp = {};
  if (query.from) {
    const from = new Date(query.from);
    if (!Number.isNaN(from.getTime())) timestamp.$gte = from;
  }
  if (query.to) {
    const to = new Date(query.to);
    if (!Number.isNaN(to.getTime())) timestamp.$lte = to;
  }
  if (Object.keys(timestamp).length) filter.timestamp = timestamp;

  const [logs, total] = await Promise.all([
    Log.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Log.countDocuments(filter),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    pages: Math.max(Math.ceil(total / limit), 1),
  };
}

/**
 * Level breakdown for the last 24 hours, plus overall totals.
 */
export async function getLogStats() {
  const since = new Date(Date.now() - DAY_MS);

  const [byLevel, total, last24h, latest] = await Promise.all([
    Log.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]),
    Log.countDocuments(),
    Log.countDocuments({ timestamp: { $gte: since } }),
    Log.findOne().sort({ timestamp: -1 }).select("timestamp level").lean(),
  ]);

  const counts = LOG_LEVELS.reduce((acc, level) => {
    acc[level] = 0;
    return acc;
  }, {});

  byLevel.forEach((row) => {
    if (row._id) counts[row._id] = row.count;
  });

  return {
    total,
    last24h,
    byLevel: counts,
    latestAt: latest?.timestamp || null,
  };
}

/**
 * Housekeeping — omit `olderThanDays` to clear everything.
 */
export async function clearLogs({ olderThanDays } = {}) {
  const days = Number(olderThanDays);
  const hasWindow = Number.isFinite(days) && days > 0;

  const filter = hasWindow
    ? { timestamp: { $lt: new Date(Date.now() - days * DAY_MS) } }
    : {};

  const { deletedCount } = await Log.deleteMany(filter);

  await logger.info("Developer cleared application logs", {
    olderThanDays: hasWindow ? days : "all",
    deletedCount,
  });

  return deletedCount;
}
