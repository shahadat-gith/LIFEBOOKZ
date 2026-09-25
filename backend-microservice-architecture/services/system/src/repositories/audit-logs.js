import { AuditLog } from "../models/audit-log.js";

const LOG_LEVELS = ["debug", "info", "warn", "error"];
const MAX_PAGE_SIZE = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createAuditLogRepository() {
  return {
    async record(entry) {
      return AuditLog.create(entry);
    },

    /**
     * Filterable, paginated view for the developer portal's log page
     * (mirrors the monolith's `listLogs` query contract).
     */
    async list(query = {}) {
      const limit = Math.min(Math.max(Number(query.limit) || 50, 1), MAX_PAGE_SIZE);
      const page = Math.max(Number(query.page) || 1, 1);

      const filter = {};

      if (query.level && LOG_LEVELS.includes(query.level)) filter.outcome = query.level === "error" ? "failure" : "success";
      if (query.action) filter.action = query.action;
      if (query.actorRole) filter.actorRole = query.actorRole;

      if (query.search?.trim()) {
        const rx = new RegExp(escapeRegex(query.search.trim()), "i");
        filter.$or = [{ action: rx }, { targetType: rx }, { targetId: rx }, { actorId: rx }];
      }

      const timestamp = {};
      if (query.from && !Number.isNaN(new Date(query.from).getTime())) timestamp.$gte = new Date(query.from);
      if (query.to && !Number.isNaN(new Date(query.to).getTime())) timestamp.$lte = new Date(query.to);
      if (Object.keys(timestamp).length) filter.createdAt = timestamp;

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(filter),
      ]);

      return { logs, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
    },

    /** Level breakdown for the last 24 hours, plus overall totals. */
    async stats() {
      const since = new Date(Date.now() - DAY_MS);

      const [byAction, total, last24h, latest] = await Promise.all([
        AuditLog.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: "$action", count: { $sum: 1 } } }]),
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $gte: since } }),
        AuditLog.findOne().sort({ createdAt: -1 }).select("createdAt action").lean(),
      ]);

      const counts = {};
      byAction.forEach((row) => {
        if (row._id) counts[row._id] = row.count;
      });

      return { total, last24h, byAction: counts, latestAt: latest?.createdAt || null };
    },
  };
}
