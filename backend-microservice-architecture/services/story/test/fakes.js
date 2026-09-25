process.env.NODE_ENV = "test";
process.env.EVENT_BUS_NAME ||= "lifebookz-events";

import { Lifebook } from "../src/models/lifebook.js";

export function createLogger() {
  const lines = [];

  const logger = {
    lines,
    info: (message, meta) => lines.push({ level: "info", message, meta }),
    warn: (message, meta) => lines.push({ level: "warn", message, meta }),
    error: (message, meta) => lines.push({ level: "error", message, meta }),
    debug: (message, meta) => lines.push({ level: "debug", message, meta }),
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

/**
 * In-memory lifebook store that still hands out **real mongoose documents** for
 * the write path, so chapter/entry subdocument behaviour (ids, ordering,
 * validation) is exercised for real.
 */
export function createFakeLifebooks(seed = []) {
  let counter = seed.length;

  const store = new Map(
    seed.map((doc) => {
      const document = new Lifebook(doc);
      return [String(document._id), { document, plain: document.toObject({ virtuals: true }) }];
    }),
  );

  const toPlain = (document) => document.toObject({ virtuals: true });

  function snapshot(document) {
    const plain = toPlain(document);
    store.set(String(document._id), { document, plain });
    return plain;
  }

  function rows() {
    return [...store.values()].map((entry) => entry.plain);
  }

  return {
    store,
    rows,
    async create(doc) {
      counter += 1;
      const document = new Lifebook({ _id: doc._id, ...doc });
      snapshot(document);

      return document;
    },
    async findById(id) {
      const entry = store.get(String(id));
      return entry ? entry.plain : null;
    },
    async findByIdOrSlug(value) {
      return rows().find((row) => String(row._id) === String(value) || row.slug === value) || null;
    },
    async findOwned({ storyId, authorId }) {
      const entry = store.get(String(storyId));

      if (!entry) return null;
      if (String(entry.document.author) !== String(authorId)) return null;

      return entry.document;
    },
    async save(document) {
      return snapshot(document);
    },
    async deleteOwned({ storyId, authorId }) {
      const entry = store.get(String(storyId));

      if (!entry || String(entry.document.author) !== String(authorId)) return false;

      store.delete(String(storyId));

      return true;
    },
    async listDrafts({ authorId }) {
      const items = rows().filter((row) => String(row.author) === String(authorId));

      return { items, total: items.length, page: 1, limit: 20, pages: 1 };
    },
    async listMine({ authorId }) {
      return rows().filter((row) => String(row.author) === String(authorId));
    },
    async listPublished() {
      const items = rows().filter((row) => row.status === "published" && row.visibility === "public");

      return { items, total: items.length, page: 1, limit: 12, pages: 1 };
    },
    async searchPublished({ q }) {
      return rows().filter((row) => !q || row.title.toLowerCase().includes(String(q).toLowerCase()));
    },
    async aggregateAuthorStats(authorId) {
      const mine = rows().filter((row) => String(row.author) === String(authorId));

      return {
        likes: mine.reduce((total, row) => total + (row.stats?.likes || 0), 0),
        chapters: mine.reduce((total, row) => total + (row.chapters?.length || 0), 0),
        stories: mine.reduce(
          (total, row) => total + (row.chapters || []).reduce((sum, chapter) => sum + (chapter.stories?.length || 0), 0),
          0,
        ),
      };
    },
    async countByAuthor({ authorId, status }) {
      return rows().filter((row) => String(row.author) === String(authorId) && (!status || row.status === status)).length;
    },
    async incrementStats({ storyId, likes = 0, comments = 0 }) {
      const entry = store.get(String(storyId));
      if (!entry) return null;

      if (likes) entry.document.stats.likes += likes;
      if (comments) entry.document.stats.comments += comments;

      return snapshot(entry.document);
    },
    async pushRecentLiker({ storyId, liker }) {
      const entry = store.get(String(storyId));
      if (entry) snapshot(entry.document);

      return null;
    },
    async removeRecentLiker() {
      return null;
    },
    async updateAuthorProfession({ authorId, profession }) {
      let touched = 0;
      for (const entry of store.values()) {
        if (String(entry.document.author) === String(authorId)) {
          entry.document.authorProfession = profession ? profession.toLowerCase() : null;
          snapshot(entry.document);
          touched += 1;
        }
      }

      return touched;
    },
  };
}

const EMPTY_STATS = { followers: 0, following: 0, stories: 0, likes: 0 };

export function createFakeAuthorProfiles(seed = []) {
  // Mongoose applies these defaults on write; the in-memory double has to as well.
  const profiles = new Map(
    seed.map((profile) => [String(profile._id), { stats: { ...EMPTY_STATS }, ...profile, stats: { ...EMPTY_STATS, ...profile.stats } }]),
  );

  return {
    profiles,
    async createFromAccount({ accountId, email, username, fullName, role }) {
      if (role && role !== "author") return null;

      const profile = {
        _id: accountId,
        email,
        username,
        fullName,
        profession: "",
        bio: "",
        phone: "",
        dob: null,
        gender: null,
        address: {},
        socialLinks: {},
        verification: { status: "pending" },
        accountStatus: "active",
        isProfileCompleted: false,
        stats: { followers: 0, following: 0, stories: 0, likes: 0 },
      };
      profiles.set(String(accountId), profile);

      return profile;
    },
    async syncIdentity({ accountId, fullName, username, avatar }) {
      const profile = profiles.get(String(accountId));
      if (!profile) return null;

      if (fullName !== undefined) profile.fullName = fullName;
      if (username !== undefined) profile.username = username;
      if (avatar !== undefined) profile.avatar = typeof avatar === "string" ? { url: avatar } : avatar;

      return profile;
    },
    async syncVerification({ accountId, status, reason }) {
      const profile = profiles.get(String(accountId));
      if (!profile) return null;

      profile.verification = { status, rejectionReason: reason || "" };

      return profile;
    },
    async syncAccountStatus({ accountId, status }) {
      const profile = profiles.get(String(accountId));
      if (profile) profile.accountStatus = status;

      return profile;
    },
    async findById(accountId) {
      return profiles.get(String(accountId)) || null;
    },
    async findManyByIds(ids = []) {
      return ids.map((id) => profiles.get(String(id))).filter(Boolean);
    },
    async updateOwned(accountId, patch) {
      const profile = profiles.get(String(accountId));
      if (!profile) return null;

      Object.assign(profile, patch);

      return profile;
    },
    async markProfileSubmitted(accountId) {
      const profile = profiles.get(String(accountId));
      if (profile) profile.isProfileCompleted = true;

      return profile;
    },
    async incrementStats(accountId, patch) {
      const profile = profiles.get(String(accountId));
      if (!profile) return null;

      for (const [key, value] of Object.entries(patch)) {
        profile.stats[key] = (profile.stats[key] || 0) + value;
      }

      return profile;
    },
    async listApproved() {
      return [...profiles.values()].filter((profile) => profile.verification?.status === "approved");
    },
    async listProfessions() {
      return [{ value: "writer", label: "Writer", count: 1 }];
    },
  };
}

export function createFakeEngagement() {
  const likes = [];
  const comments = [];
  const follows = [];

  return {
    likes,
    comments,
    follows,
    async findLike({ storyId, accountId }) {
      return likes.find((like) => String(like.story) === String(storyId) && String(like.account) === String(accountId)) || null;
    },
    async createLike({ storyId, story, accountId, account, accountModel }) {
      const row = { story: story ?? storyId, account: account ?? accountId, accountModel };
      likes.push(row);
      return row;
    },
    async deleteLike({ storyId, accountId }) {
      const index = likes.findIndex((like) => String(like.story) === String(storyId) && String(like.account) === String(accountId));
      if (index < 0) return false;
      likes.splice(index, 1);
      return true;
    },
    async countLikes(storyId) {
      return likes.filter((like) => String(like.story) === String(storyId)).length;
    },
    async listLikes(storyId) {
      return likes.filter((like) => String(like.story) === String(storyId));
    },
    async likedStoryIds({ accountId, storyIds }) {
      return new Set(
        likes
          .filter((like) => String(like.account) === String(accountId))
          .map((like) => String(like.story))
          .filter((id) => storyIds.map(String).includes(id)),
      );
    },
    async createComment({ storyId, accountId, accountModel, content }) {
      const comment = {
        _id: `comment-${comments.length + 1}`,
        id: `comment-${comments.length + 1}`,
        story: storyId,
        account: accountId,
        accountModel,
        content,
        likes: [],
        replies: [],
        save: async () => comment,
        deleteOne: async () => true,
      };
      comments.push(comment);

      return comment;
    },
    async findCommentById(commentId) {
      return comments.find((comment) => String(comment._id) === String(commentId)) || null;
    },
    async listComments({ storyId }) {
      const items = comments.filter((comment) => String(comment.story) === String(storyId));

      return { items, total: items.length, page: 1, limit: 20, pages: 1 };
    },
    async countComments(storyId) {
      return comments.filter((comment) => String(comment.story) === String(storyId)).length;
    },
    async findFollow({ followerId, authorId }) {
      return follows.find((follow) => String(follow.follower) === String(followerId) && String(follow.author) === String(authorId)) || null;
    },
    async createFollow({ followerId, follower, followerModel, authorId, author }) {
      const row = { follower: follower ?? followerId, followerModel, author: author ?? authorId };
      follows.push(row);
      return row;
    },
    async deleteFollow({ followerId, authorId }) {
      const index = follows.findIndex(
        (follow) => String(follow.follower) === String(followerId) && String(follow.author) === String(authorId),
      );
      if (index < 0) return false;
      follows.splice(index, 1);
      return true;
    },
    async countFollowers(authorId) {
      return follows.filter((follow) => String(follow.author) === String(authorId)).length;
    },
    async countFollowing(accountId) {
      return follows.filter((follow) => String(follow.follower) === String(accountId)).length;
    },
    async listFollowers(authorId) {
      return follows.filter((follow) => String(follow.author) === String(authorId));
    },
    async listFollowing(accountId) {
      return follows.filter((follow) => String(follow.follower) === String(accountId));
    },
  };
}

export function createFakeMediaStore() {
  return {
    async presignUpload({ kind, accountId }) {
      return { uploadUrl: "https://r2.example/put", key: `${kind}/${accountId}/file.jpg`, url: "https://cdn.example/file.jpg", expiresIn: 600 };
    },
    async deleteMedia() {
      return true;
    },
    objectKeyFromUrl(url) {
      return /^https?:\/\//i.test(url) ? url.split("/").slice(3).join("/") : url;
    },
  };
}

export function createFakeTestimonials() {
  const rows = [];

  return {
    rows,
    async list() {
      return rows;
    },
    async findMine({ person }) {
      return rows.find((row) => String(row.person) === String(person)) || null;
    },
    async findById(id) {
      return rows.find((row) => String(row._id) === String(id)) || null;
    },
    async upsert({ person, personType, message, rating }) {
      const existing = rows.find((row) => String(row.person) === String(person));
      if (existing) {
        Object.assign(existing, { message, rating });
        return existing;
      }

      const created = { _id: `t-${rows.length + 1}`, person, personType, message, rating, status: "approved" };
      rows.push(created);

      return created;
    },
    async delete(id) {
      const index = rows.findIndex((row) => String(row._id) === String(id));
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
    async setStatus({ id, status }) {
      const row = rows.find((entry) => String(entry._id) === String(id));
      if (row) row.status = status;
      return row;
    },
  };
}
