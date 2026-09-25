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

export function createFakeExpertProfiles(seed = []) {
  const profiles = new Map(
    seed.map((profile) => [
      String(profile._id),
      {
        email: "",
        username: "",
        fullName: "",
        avatar: {},
        accountStatus: "active",
        verification: { status: "pending", verifiedAt: null, rejectionReason: "" },
        phone: "",
        expertise: "",
        qualification: "",
        bio: "",
        categories: [],
        languages: ["English"],
        experience: 0,
        price: 0,
        rating: 0,
        ratingCount: 0,
        sessions: 0,
        coverImage: {},
        coverImageMobile: {},
        isProfileCompleted: false,
        profileSubmittedAt: null,
        ...profile,
      },
    ]),
  );

  return {
    profiles,
    async findById(id) {
      return profiles.get(String(id)) || null;
    },
    async findPublicById(id) {
      const profile = profiles.get(String(id));
      if (!profile || profile.accountStatus !== "active" || profile.verification?.status !== "approved") return null;
      return profile;
    },
    async listApproved({ category, limit = 5 } = {}) {
      return (await this.listApprovedCandidates({ category })).slice(0, limit);
    },
    async listApprovedCandidates({ category } = {}) {
      return [...profiles.values()]
        .filter((profile) => profile.accountStatus === "active" && profile.verification?.status === "approved")
        .filter((profile) => !category || (profile.categories || []).includes(category));
    },
    async createFromAccount({ accountId, email, username, fullName }) {
      if (profiles.has(String(accountId))) return false;

      profiles.set(String(accountId), {
        _id: accountId,
        email,
        username,
        fullName,
        accountStatus: "active",
        verification: { status: "pending" },
        categories: [],
        isProfileCompleted: false,
        sessions: 0,
      });

      return true;
    },
    async syncIdentity({ accountId, fullName, username, email, avatar }) {
      const profile = profiles.get(String(accountId));
      if (!profile) return null;

      if (fullName !== undefined) profile.fullName = fullName;
      if (username !== undefined) profile.username = username;
      if (email !== undefined) profile.email = email;
      if (avatar !== undefined) profile.avatar = avatar;

      return profile;
    },
    async syncVerification({ accountId, status, reason }) {
      const profile = profiles.get(String(accountId));
      if (!profile) return null;

      profile.verification = { status, rejectionReason: reason || "", verifiedAt: status === "approved" ? new Date() : null };

      return profile;
    },
    async syncAccountStatus({ accountId, status }) {
      const profile = profiles.get(String(accountId));
      if (profile) profile.accountStatus = status;

      return profile;
    },
    async updateOwned(accountId, patch) {
      const profile = profiles.get(String(accountId));
      if (!profile) return null;

      Object.assign(profile, patch);

      return profile;
    },
    async incrementSessions({ accountId, by = 1 }) {
      const profile = profiles.get(String(accountId));
      if (profile) profile.sessions = (profile.sessions || 0) + by;

      return { modifiedCount: profile ? 1 : 0 };
    },
  };
}

const EXPERT_CARD_KEYS = ["fullName", "username", "avatar", "expertise", "categories", "price", "rating", "sessions"];

export function createFakeBookings({ expertProfiles } = {}) {
  const rows = [];
  let counter = 0;

  const card = (expertId) => {
    const profile = expertProfiles?.profiles?.get(String(expertId));
    if (!profile) return expertId;

    const out = { id: String(expertId) };
    for (const key of EXPERT_CARD_KEYS) out[key] = profile[key];

    return out;
  };

  return {
    rows,
    async create(doc) {
      counter += 1;
      const row = {
        _id: `booking-${counter}`,
        id: `booking-${counter}`,
        status: "pending",
        completedAt: null,
        notes: "",
        date: "",
        time: "",
        createdAt: new Date(),
        ...doc,
      };

      rows.push(row);

      return { ...row, toObject: ({ virtuals } = {}) => row, _id: row._id };
    },
    async findById(id) {
      return rows.find((row) => String(row._id) === String(id)) || null;
    },
    async findForClient({ bookingId, clientId }) {
      const row = rows.find((entry) => String(entry._id) === String(bookingId));
      if (!row || String(row.client) !== String(clientId)) return null;

      return {
        ...row,
        save: async () => row,
      };
    },
    async findForExpert({ bookingId, expertId }) {
      const row = rows.find((entry) => String(entry._id) === String(bookingId));
      if (!row || String(row.expert) !== String(expertId)) return null;

      return { ...row, save: async () => row };
    },
    async save(document) {
      const row = rows.find((entry) => String(entry._id) === String(document._id));
      if (row) Object.assign(row, document);

      return row;
    },
    async listForClient({ clientId }) {
      return rows
        .filter((row) => String(row.client) === String(clientId))
        .map((row) => ({ ...row, expert: card(row.expert) }));
    },
    async listForExpert({ expertId }) {
      return rows
        .filter((row) => String(row.expert) === String(expertId))
        .map((row) => ({ ...row, expert: card(row.expert) }));
    },
    async transitionStatus({ bookingId, expertId, to, completedAt = null }) {
      const row = rows.find((entry) => String(entry._id) === String(bookingId));
      if (!row) return false;
      if (String(row.expert) !== String(expertId)) return false;
      if (row.status === to) return false;

      row.status = to;
      row.statusChangedAt = new Date();
      if (completedAt) row.completedAt = completedAt;

      return true;
    },
    async count({ expertId, status }) {
      return rows.filter((row) => String(row.expert) === String(expertId) && (!status || row.status === status)).length;
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

export function createFakeMediaStore() {
  return {
    async presignUpload({ kind, accountId }) {
      return {
        uploadUrl: "https://r2.example/put",
        key: `${kind}/${accountId}/file.jpg`,
        url: "https://cdn.example/file.jpg",
        expiresIn: 600,
      };
    },
    async deleteMedia() {
      return true;
    },
    objectKeyFromUrl(url) {
      return /^https?:\/\//i.test(url) ? url.split("/").slice(3).join("/") : url;
    },
  };
}
