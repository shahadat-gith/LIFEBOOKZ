/** In-memory fakes for the System service tests — no AWS, no MongoDB. */

export function createFakeReviewQueue() {
  const rows = new Map();

  return {
    rows,

    async upsertSubmitted({ accountId, role, email, username, fullName, summary, submittedAt }) {
      const existing = rows.get(String(accountId)) || {};
      const row = {
        id: String(accountId),
        role,
        email: email ?? existing.email ?? "",
        username: username ?? existing.username ?? "",
        fullName: fullName ?? existing.fullName ?? "",
        summary: summary ?? existing.summary ?? { profession: "", expertise: "", categories: [] },
        verification: { status: "pending", rejectionReason: "" },
        submittedAt: submittedAt || new Date().toISOString(),
      };
      rows.set(String(accountId), row);
      return row;
    },

    async syncVerification({ accountId, status, reason, verifiedAt }) {
      const row = rows.get(String(accountId));
      if (!row) return null;
      row.verification = { status, rejectionReason: status === "rejected" ? reason || "" : "", verifiedAt };
      return row;
    },

    async syncIdentity({ accountId, role, email, username, fullName }) {
      const row = rows.get(String(accountId));
      if (!row || row.role !== role) return null;
      if (email !== undefined) row.email = email;
      if (username !== undefined) row.username = username;
      if (fullName !== undefined) row.fullName = fullName;
      return row;
    },

    async listByStatus(role, status) {
      return [...rows.values()].filter((r) => r.role === role && r.verification.status === status);
    },

    async counts() {
      const all = [...rows.values()];
      const count = (role, status) => all.filter((r) => r.role === role && r.verification.status === status).length;
      return {
        pendingAuthors: count("author", "pending"),
        pendingExperts: count("expert", "pending"),
        approvedAuthors: count("author", "approved"),
        approvedExperts: count("expert", "approved"),
      };
    },
  };
}

export function createFakeAuditLogs() {
  const entries = [];

  return {
    entries,

    async record(entry) {
      entries.push({ id: `audit-${entries.length + 1}`, ...entry });
      return entry;
    },

    async list(query = {}) {
      let rows = [...entries];
      if (query.action) rows = rows.filter((r) => r.action === query.action);
      if (query.actorRole) rows = rows.filter((r) => r.actorRole === query.actorRole);
      if (query.search) rows = rows.filter((r) => JSON.stringify(r).includes(query.search));
      return { logs: rows.reverse(), total: rows.length, page: 1, limit: query.limit || 50, pages: 1 };
    },

    async stats() {
      return { total: entries.length, last24h: entries.length, byAction: {}, latestAt: entries.at(-1)?.createdAt || null };
    },
  };
}

export function createFakePublisher() {
  const published = [];

  return {
    published,
    async publish(input) {
      published.push(input);
      return input;
    },
    async publishSafely(input) {
      published.push(input);
      return input;
    },
  };
}

export function createFakeAuthClient({ fail } = {}) {
  const calls = [];

  return {
    calls,
    async decideVerification({ accountId, decision, reason }) {
      calls.push({ accountId, decision, reason });

      if (fail) {
        const error = new Error("auth down");
        error.statusCode = 503;
        throw error;
      }

      return { accountId, decision };
    },
  };
}

export function createLogger() {
  const noop = () => {};
  return { debug: noop, info: noop, warn: noop, error: noop, failure: noop, child: () => createLogger() };
}
