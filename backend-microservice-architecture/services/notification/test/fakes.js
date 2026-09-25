process.env.NODE_ENV = "test";
process.env.EVENT_BUS_NAME ||= "lifebookz-events";

export function createLogger() {
  const lines = [];

  const logger = {
    lines,
    debug: (message, meta) => lines.push({ level: "debug", message, meta }),
    info: (message, meta) => lines.push({ level: "info", message, meta }),
    warn: (message, meta) => lines.push({ level: "warn", message, meta }),
    error: (message, meta) => lines.push({ level: "error", message, meta }),
    failure: (message, error, meta) => lines.push({ level: "error", message, meta, error }),
    child() {
      return logger;
    },
  };

  return logger;
}

export function createPublisher() {
  const published = [];

  return {
    published,
    async publish(input) {
      published.push(input);
      return { eventId: `evt-${published.length}`, ...input };
    },
    async publishSafely(input) {
      published.push(input);
      return { eventId: `evt-${published.length}`, ...input };
    },
    of(type) {
      return published.filter((event) => event.type === type);
    },
  };
}

/** In-memory email queue that records jobs and can be made to fail. */
export function createFakeQueue({ fail = false } = {}) {
  const jobs = [];

  return {
    jobs,
    fail,
    async send(job) {
      if (fail) throw new Error("SQS unavailable");
      jobs.push(job);
      return job;
    },
    async sendSafely(job) {
      try {
        return await this.send(job);
      } catch {
        return null;
      }
    },
    of(template) {
      return jobs.filter((job) => job.template === template);
    },
  };
}

export function createFakeNotifications() {
  const rows = [];

  return {
    rows,
    async create(doc) {
      if (doc.dedupeKey && rows.some((row) => row.dedupeKey === doc.dedupeKey)) return null;

      const row = {
        _id: `n-${rows.length + 1}`,
        read: false,
        title: "",
        preview: "",
        link: "",
        commentId: null,
        createdAt: new Date(),
        ...doc,
      };
      rows.push(row);

      return row;
    },
    async list({ recipientId, recipientModel, limit = 20, before }) {
      const mine = rows.filter((row) => String(row.recipient) === String(recipientId) && row.recipientModel === recipientModel);
      const start = before ? mine.findIndex((row) => String(row._id) === String(before)) + 1 : 0;
      const items = mine.slice(start, start + limit);

      return {
        items,
        hasMore: start + limit < mine.length,
        nextBefore: items.length === limit ? String(items[items.length - 1]._id) : null,
      };
    },
    async unreadCount({ recipientId, recipientModel }) {
      return rows.filter((row) => String(row.recipient) === String(recipientId) && row.recipientModel === recipientModel && !row.read)
        .length;
    },
    async markRead({ recipientId, recipientModel, notificationId }) {
      const row = rows.find(
        (entry) =>
          String(entry._id) === String(notificationId) &&
          String(entry.recipient) === String(recipientId) &&
          entry.recipientModel === recipientModel,
      );

      if (!row) return null;
      row.read = true;

      return row;
    },
    async markAllRead({ recipientId, recipientModel }) {
      let modifiedCount = 0;

      for (const row of rows) {
        if (String(row.recipient) === String(recipientId) && row.recipientModel === recipientModel && !row.read) {
          row.read = true;
          modifiedCount += 1;
        }
      }

      return { modifiedCount };
    },
    async remove({ recipientId, recipientModel, notificationId }) {
      const index = rows.findIndex(
        (entry) =>
          String(entry._id) === String(notificationId) &&
          String(entry.recipient) === String(recipientId) &&
          entry.recipientModel === recipientModel,
      );

      if (index < 0) return false;
      rows.splice(index, 1);

      return true;
    },
    async clear({ recipientId, recipientModel }) {
      let deletedCount = 0;

      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (String(rows[index].recipient) === String(recipientId) && rows[index].recipientModel === recipientModel) {
          rows.splice(index, 1);
          deletedCount += 1;
        }
      }

      return { deletedCount };
    },
  };
}

export function createFakeAccountProjections(seed = []) {
  const accounts = new Map(seed.map((account) => [String(account._id), account]));

  return {
    accounts,
    async upsertFromAccount({ accountId, role, email, username, fullName, avatar }) {
      const existing = accounts.get(String(accountId));
      const account = { ...existing, _id: accountId, role, email, username, fullName };
      if (avatar !== undefined) account.avatar = avatar;
      accounts.set(String(accountId), account);

      return account;
    },
    async syncIdentity({ accountId, fullName, username, email, avatar, role }) {
      const account = accounts.get(String(accountId));
      if (!account) return null;

      if (fullName !== undefined) account.fullName = fullName;
      if (username !== undefined) account.username = username;
      if (email !== undefined) account.email = email;
      if (avatar !== undefined) account.avatar = avatar;
      if (role !== undefined) account.role = role;

      return account;
    },
    async findById(accountId) {
      return accounts.get(String(accountId)) || null;
    },
    async findManyByIds(ids = []) {
      return ids.map((id) => accounts.get(String(id))).filter(Boolean);
    },
  };
}

export function createFakeProcessedEvents() {
  const claimed = new Set();

  return {
    claimed,
    async claim(eventId) {
      if (claimed.has(eventId)) return false;
      claimed.add(eventId);

      return true;
    },
    async release(eventId) {
      claimed.delete(eventId);
    },
  };
}
