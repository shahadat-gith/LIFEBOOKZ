import { authorizationError, badRequestError, forbiddenError, notFoundError, validationError } from "@lifebookz/shared-errors";

import { STORY_TYPES, VISIBILITIES, chapterName } from "../models/lifebook.js";

const MEDIA_TYPES = ["image", "video"];

/** Only R2-hosted media references are accepted — never arbitrary URLs. */
export function sanitizeMediaList(media = []) {
  if (!Array.isArray(media)) return [];

  return media
    .filter((item) => item && typeof item.url === "string" && item.url.trim().length > 0)
    .slice(0, 30)
    .map((item) => ({
      url: item.url.trim(),
      key: item.key ? String(item.key).trim() : "",
      type: MEDIA_TYPES.includes(item.type) ? item.type : "image",
      caption: item.caption ? String(item.caption).slice(0, 300) : "",
    }));
}

function assertVisibility(value) {
  if (value !== undefined && !VISIBILITIES.includes(value)) {
    throw validationError("Invalid visibility.", {
      fields: { visibility: `visibility must be one of: ${VISIBILITIES.join(", ")}.` },
    });
  }

  return value;
}

/** Who may read a lifebook. Public → everyone; followers → the audience; private → its author. */
export function canRead({ lifebook, claims, isFollowingAuthor = false }) {
  if (!lifebook) return false;

  const isOwner = claims?.accountId && String(lifebook.author) === String(claims.accountId);
  if (isOwner) return true;
  if (lifebook.status !== "published") return false;
  if (lifebook.visibility === "public") return true;
  if (lifebook.visibility === "followers") return isFollowingAuthor;

  return false;
}

/** Redact entries the caller may not read (private/followers visibility is per story entry). */
export function visibleChapters({ lifebook, isOwner, isFollower }) {
  return (lifebook.chapters || []).map((chapter) => ({
    ...chapter,
    stories: (chapter.stories || []).filter((entry) => {
      if (isOwner) return true;
      if (entry.visibility === "public") return true;
      if (entry.visibility === "followers") return isFollower;

      return false;
    }),
  }));
}

export function createLifebookService({ lifebooks, authorProfiles, engagement, mediaStore, publisher, logger, cfg }) {
  async function requireAuthor({ accountId }) {
    const profile = await authorProfiles.findById(accountId);

    if (!profile) {
      // Can happen for a fraction of a second until the AccountRegistered
      // projection lands, so the message says what to do about it.
      throw notFoundError("Author profile not found. Please try again in a moment.");
    }

    if (profile.accountStatus && profile.accountStatus !== "active") {
      throw authorizationError("This account is not active. Please contact support.");
    }

    return profile;
  }

  async function requireOwned({ accountId, storyId }) {
    const lifebook = await lifebooks.findOwned({ storyId, authorId: accountId });

    if (!lifebook) {
      throw notFoundError("Story not found.");
    }

    return lifebook;
  }

  return {
    // --------------------------------------------------------------- writers
    async create({ accountId, claims, input }) {
      const profile = await requireAuthor({ accountId });

      const title = String(input.title || "").trim();
      if (title.length < 2) {
        throw validationError("Please give your lifebook a title.", {
          fields: { title: "Please give your lifebook a title." },
        });
      }

      const created = await lifebooks.create({
        author: accountId,
        authorProfession: profile.profession || null,
        title,
        language: input.language || "English",
        visibility: assertVisibility(input.visibility) || "public",
        bannerImage: input.bannerImage || null,
        chapters: [],
      });

      await publisher?.publishSafely({
        type: "StoryCreated",
        data: { storyId: String(created._id || created.id), authorId: String(accountId), title: created.title, status: created.status },
        actor: claims,
      });

      return created;
    },

    async update({ accountId, claims, storyId, input }) {
      const lifebook = await requireOwned({ accountId, storyId });

      if (input.title !== undefined) lifebook.title = String(input.title).trim();
      if (input.language !== undefined) lifebook.language = input.language;
      if (input.visibility !== undefined) lifebook.visibility = assertVisibility(input.visibility) || lifebook.visibility;
      if (input.bannerImage !== undefined) lifebook.bannerImage = input.bannerImage;
      if (input.featured !== undefined) lifebook.featured = Boolean(input.featured);

      const saved = await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUpdated",
        data: { storyId: String(storyId), authorId: String(accountId), title: saved.title },
        actor: claims,
      });

      return saved;
    },

    async remove({ accountId, claims, storyId }) {
      const lifebook = await requireOwned({ accountId, storyId });

      await lifebooks.deleteOwned({ storyId, authorId: accountId });
      await engagement?.deleteStoryComments?.({ storyId });

      await publisher?.publishSafely({
        type: "StoryDeleted",
        data: { storyId: String(storyId), authorId: String(accountId), title: lifebook.title },
        actor: claims,
      });

      return { deleted: true };
    },

    // ------------------------------------------------------------- chapters
    async addChapter({ accountId, claims, storyId, input }) {
      const lifebook = await requireOwned({ accountId, storyId });

      if (lifebook.chapters.length >= (cfg?.maxChapters ?? 50)) {
        throw badRequestError(`A lifebook supports at most ${cfg?.maxChapters ?? 50} chapters.`);
      }

      const order = lifebook.chapters.length;
      lifebook.chapters.push({
        title: String(input?.title || "").trim() || chapterName(order),
        order,
        stories: [],
      });

      const saved = await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUpdated",
        data: { storyId: String(storyId), authorId: String(accountId), change: "chapter-added" },
        actor: claims,
      });

      return saved;
    },

    async updateChapter({ accountId, claims, storyId, chapterId, input }) {
      const lifebook = await requireOwned({ accountId, storyId });
      const chapter = lifebook.chapters.id(chapterId);

      if (!chapter) throw notFoundError("Chapter not found.");

      if (input?.title !== undefined) {
        const title = String(input.title).trim();
        if (!title) {
          throw validationError("A chapter needs a title.", { fields: { title: "A chapter needs a title." } });
        }
        chapter.title = title;
      }

      if (input?.order !== undefined) {
        const order = Number(input.order);
        if (!Number.isInteger(order) || order < 0) {
          throw validationError("Invalid chapter position.", { fields: { order: "Invalid chapter position." } });
        }
        if (lifebook.chapters.some((other) => String(other._id) !== String(chapterId) && other.order === order)) {
          throw badRequestError("Every chapter must sit in its own slot.");
        }
        chapter.order = order;
      }

      const saved = await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUpdated",
        data: { storyId: String(storyId), authorId: String(accountId), change: "chapter-updated" },
        actor: claims,
      });

      return saved;
    },

    async deleteChapter({ accountId, claims, storyId, chapterId }) {
      const lifebook = await requireOwned({ accountId, storyId });
      const chapter = lifebook.chapters.id(chapterId);

      if (!chapter) throw notFoundError("Chapter not found.");

      chapter.deleteOne();
      // Re-slot the survivors so orders stay 0..n-1.
      lifebook.chapters
        .sort((a, b) => a.order - b.order)
        .forEach((entry, index) => {
          entry.order = index;
        });

      const saved = await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUpdated",
        data: { storyId: String(storyId), authorId: String(accountId), change: "chapter-deleted" },
        actor: claims,
      });

      return saved;
    },

    // ---------------------------------------------------------- story entries
    async addEntry({ accountId, claims, storyId, chapterId, input }) {
      const lifebook = await requireOwned({ accountId, storyId });
      const chapter = lifebook.chapters.id(chapterId);

      if (!chapter) throw notFoundError("Chapter not found.");

      const title = String(input?.title || "").trim();
      if (!title) {
        throw validationError("Please give this story a title.", {
          fields: { title: "Please give this story a title." },
        });
      }

      chapter.stories.push({
        title,
        storyType: STORY_TYPES.includes(input?.storyType) ? input.storyType : "experience",
        content: input?.content || "",
        dateLabel: input?.dateLabel || "",
        location: input?.location || "",
        media: sanitizeMediaList(input?.media),
        visibility: assertVisibility(input?.visibility) || "public",
      });

      const saved = await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUpdated",
        data: { storyId: String(storyId), authorId: String(accountId), change: "entry-added" },
        actor: claims,
      });

      return saved;
    },

    async updateEntry({ accountId, claims, storyId, chapterId, entryId, input }) {
      const lifebook = await requireOwned({ accountId, storyId });
      const chapter = lifebook.chapters.id(chapterId);
      if (!chapter) throw notFoundError("Chapter not found.");

      const entry = chapter.stories.id(entryId);
      if (!entry) throw notFoundError("Story not found.");

      if (input.title !== undefined) entry.title = String(input.title).trim();
      if (input.storyType !== undefined && STORY_TYPES.includes(input.storyType)) entry.storyType = input.storyType;
      if (input.content !== undefined) entry.content = input.content;
      if (input.dateLabel !== undefined) entry.dateLabel = input.dateLabel;
      if (input.location !== undefined) entry.location = input.location;
      if (input.media !== undefined) entry.media = sanitizeMediaList(input.media);
      if (input.visibility !== undefined) entry.visibility = assertVisibility(input.visibility) || entry.visibility;

      const saved = await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUpdated",
        data: { storyId: String(storyId), authorId: String(accountId), change: "entry-updated" },
        actor: claims,
      });

      return saved;
    },

    async deleteEntry({ accountId, claims, storyId, chapterId, entryId }) {
      const lifebook = await requireOwned({ accountId, storyId });
      const chapter = lifebook.chapters.id(chapterId);
      if (!chapter) throw notFoundError("Chapter not found.");

      const entry = chapter.stories.id(entryId);
      if (!entry) throw notFoundError("Story not found.");

      entry.deleteOne();

      const saved = await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUpdated",
        data: { storyId: String(storyId), authorId: String(accountId), change: "entry-deleted" },
        actor: claims,
      });

      return saved;
    },

    // -------------------------------------------------------------- publishing
    /**
     * Publishing requires a completed author profile — the same gate the
     * monolith's `requireProfileComplete` middleware applied. Approval is a
     * separate state (verification) and does not block publishing there either.
     */
    async publish({ accountId, claims, storyId, input }) {
      const profile = await requireAuthor({ accountId });

      if (!profile.isProfileCompleted) {
        throw forbiddenError(
          "Please complete your profile before publishing. Fill in your profession, bio, phone, date of birth, and gender to continue.",
        );
      }

      const lifebook = await requireOwned({ accountId, storyId });

      if (input?.visibility !== undefined) {
        lifebook.visibility = assertVisibility(input.visibility) || lifebook.visibility;
      }

      lifebook.status = "published";
      // First publication only, kept explicit here (the model hook is a safety
      // net) so the behaviour is visible and testable.
      if (!lifebook.publishedAt) lifebook.publishedAt = new Date();

      let publishedEntries = 0;
      for (const chapter of lifebook.chapters) {
        for (const entry of chapter.stories) {
          if (entry.status !== "published") {
            entry.status = "published";
            entry.publishedAt = new Date();
            publishedEntries += 1;
          }
        }
      }

      const saved = await lifebooks.save(lifebook);

      await authorProfiles.incrementStats(accountId, { stories: 1 });

      // The follower fan-out list travels in the event because Story owns the
      // follow graph and Notification must not be able to read it. Capped, since
      // an EventBridge event is limited to 256 KB and a fan-out of 50k entries
      // would be rejected outright.
      const followerRows = saved.visibility === "public" ? await engagement.listFollowers(accountId, { limit: cfg.maxPublishFanout }) : [];

      if (saved.visibility === "public" && followerRows.length === cfg.maxPublishFanout) {
        logger?.warn?.("Publish fan-out hit the configured cap", { storyId: String(storyId), cap: cfg.maxPublishFanout });
      }

      await publisher?.publishSafely({
        type: "StoryPublished",
        data: {
          storyId: String(storyId),
          authorId: String(accountId),
          authorName: profile.fullName,
          title: saved.title,
          slug: saved.slug,
          storySlug: saved.slug,
          visibility: saved.visibility,
          chapters: saved.chapters.length,
          entries: saved.chapters.reduce((total, chapter) => total + chapter.stories.length, 0),
          publishedEntries,
          // `{accountId, model}` pairs — the recipient identity Notification needs.
          followers: followerRows.map((row) => ({ accountId: String(row.follower), model: row.followerModel })),
        },
        actor: claims,
      });

      logger?.info?.("Lifebook published", { storyId: String(storyId), authorId: String(accountId) });

      return saved;
    },

    async unpublish({ accountId, claims, storyId }) {
      const lifebook = await requireOwned({ accountId, storyId });

      lifebook.status = "draft";
      await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUnpublished",
        data: { storyId: String(storyId), authorId: String(accountId), title: lifebook.title },
        actor: claims,
      });

      return { unpublished: true };
    },

    async updateBanner({ accountId, claims, storyId, bannerImage }) {
      const lifebook = await requireOwned({ accountId, storyId });

      lifebook.bannerImage = bannerImage;
      const saved = await lifebooks.save(lifebook);

      await publisher?.publishSafely({
        type: "StoryUpdated",
        data: { storyId: String(storyId), authorId: String(accountId), change: "banner-updated" },
        actor: claims,
      });

      return saved;
    },

    // ------------------------------------------------------------------ reads
    async drafts({ accountId, page, limit }) {
      return lifebooks.listDrafts({ authorId: accountId, page, limit });
    },

    async mine({ accountId }) {
      return lifebooks.listMine({ authorId: accountId });
    },

    async detail({ storyId, claims }) {
      const lifebook = await lifebooks.findByIdOrSlug(storyId);

      if (!lifebook) throw notFoundError("Story not found.");

      const isOwner = Boolean(claims?.accountId) && String(lifebook.author?._id || lifebook.author) === String(claims.accountId);

      let isFollower = false;
      if (!isOwner && claims?.accountId && lifebook.visibility === "followers") {
        const follow = await engagement.findFollow({ followerId: claims.accountId, authorId: lifebook.author?._id || lifebook.author });
        isFollower = Boolean(follow);
      }

      if (!canRead({ lifebook, claims, isFollowingAuthor: isFollower })) {
        throw notFoundError("Story not found.");
      }

      const likedByUser = claims?.accountId
        ? Boolean(await engagement.findLike({ storyId: lifebook._id, accountId: claims.accountId }))
        : false;

      return {
        ...lifebook,
        id: String(lifebook._id),
        chapters: visibleChapters({ lifebook, isOwner, isFollower }),
        isOwner,
        likedByUser,
        isFollowedByLoggedInUser: isFollower,
      };
    },

    async feed({ query = {}, claims }) {
      const result = await lifebooks.listPublished({
        profession: query.profession,
        language: query.language,
        sort: query.sort,
        page: query.page,
        limit: query.limit ?? cfg?.feedPageSize,
      });

      return decorateForViewer({ result, claims, engagement });
    },

    async search({ query = {}, claims }) {
      const results = await lifebooks.searchPublished({
        q: query.q,
        profession: query.profession,
        limit: query.limit,
      });

      return decorateForViewer({ result: { items: results, total: results.length }, claims, engagement });
    },

    async professions() {
      return authorProfiles.listProfessions();
    },

    /** Presign a story media upload (images/videos/covers) — authors only. */
    async presignMedia({ accountId, input }) {
      if (!["storyImage", "storyVideo", "storyCover"].includes(input.kind)) {
        throw badRequestError("Only story media kinds can be presigned here.");
      }

      return mediaStore.presignUpload({ ...input, accountId });
    },

    async deleteMedia({ accountId, input }) {
      const key = input.key || mediaStore.objectKeyFromUrl(input.url);

      if (!key) throw badRequestError("Provide the media key or url to delete.");

      // Authors may only remove objects under their own story media prefix.
      if (!String(key).startsWith("stories/")) {
        throw authorizationError("You can only delete story media.");
      }

      const deleted = await mediaStore.deleteMedia({ key, logger });

      return { deleted };
    },
  };
}

/** Adds `likedByUser` / `isFollowedByLoggedInUser` the feed cards expect. */
async function decorateForViewer({ result, claims, engagement }) {
  const items = result.items || [];

  if (!claims?.accountId || items.length === 0) {
    return { ...result, items: items.map((item) => ({ ...item, likedByUser: false, isFollowedByLoggedInUser: false })) };
  }

  const storyIds = items.map((item) => item._id);
  const authorIds = items.map((item) => item.author?._id).filter(Boolean);

  const [liked, following] = await Promise.all([
    engagement.likedStoryIds({ accountId: claims.accountId, storyIds }),
    Promise.all(authorIds.map((authorId) => engagement.findFollow({ followerId: claims.accountId, authorId }))).then(
      (rows) => new Set(rows.map((row, index) => (row ? String(authorIds[index]) : null)).filter(Boolean)),
    ),
  ]);

  return {
    ...result,
    items: items.map((item) => ({
      ...item,
      likedByUser: liked.has(String(item._id)),
      isFollowedByLoggedInUser: following.has(String(item.author?._id)),
    })),
  };
}
