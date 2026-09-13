import Story from "./models/Story.js";
import Like from "./models/Like.js";
import Comment from "./models/Comment.js";
import Follow from "../following/model.js";
import Author from "../author/model.js";
import User from "../user/model.js";
import { createNotification } from "../notification/service.js";

import {
  uploadStoryImage,
  uploadStoryMedia,
} from "../../core/services/upload.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../../core/utils/errors.js";

const AUTHOR_POPULATE =
  "fullName username avatar profession verification.status";

const PUBLIC_VISIBILITIES = ["public"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");
}

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Simple text search across title, summary, and story content.
 */
function textMatches(story, query) {
  const q = query.toLowerCase();
  if (story.title?.toLowerCase().includes(q)) return true;
  if (story.summary?.toLowerCase().includes(q)) return true;
  if (story.chapters?.some((ch) =>
    ch.title?.toLowerCase().includes(q) ||
    ch.description?.toLowerCase().includes(q) ||
    ch.stories?.some(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.content?.toLowerCase().includes(q)
    )
  )) return true;
  return false;
}

async function findOwnedStory({ authorId, storyId }) {
  const story = await Story.findOne({ _id: storyId, author: authorId });

  if (!story) {
    throw new NotFoundError("Story not found.");
  }

  return story;
}

/* ---------- Media ---------- */

const ALLOWED_MEDIA_TYPES = ["image", "video", "audio"];

function detectMediaType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}

/**
 * Upload a single media asset (photo / video / audio) to Cloudinary and
 * return the descriptor stored in chapter or story media arrays.
 */
export async function uploadMediaAsset({ file, caption }) {
  if (!file) {
    throw new ValidationError("No media file provided.");
  }

  const type = detectMediaType(file.mimetype || "");
  if (!type || !ALLOWED_MEDIA_TYPES.includes(type)) {
    throw new ValidationError(
      "Unsupported media type. Use an image, video, or audio file.",
    );
  }

  const uploaded = await uploadStoryMedia(file.buffer, type);

  return {
    url: uploaded.url,
    publicId: uploaded.publicId,
    type,
    caption: caption?.trim() || "",
  };
}

/* ---------- Stories (lifebooks) ---------- */

/**
 * Creates a lifebook, optionally seeding the first chapter.
 */
export async function createStory({ authorId, body, file }) {
  let chapters = parseMaybeJson(body.chapters) ?? [];
  if (!Array.isArray(chapters)) chapters = [];

  const {
    title = "",
    visibility = "public",
    language = "English",
    summary = "",
  } = body;
  const cleanTitle = title?.trim() || "";

  let coverImage = null;
  if (file) {
    const uploaded = await uploadStoryImage(file.buffer);
    coverImage = { url: uploaded.url, publicId: uploaded.publicId };
  }

  const authorDoc = await Author.findById(authorId)
    .select("profession")
    .lean();

  const finalChapters = chapters.map((ch, idx) => ({
    title: ch.title || `Chapter ${idx + 1}`,
    description: ch.description || "",
    coverImage: ch.coverImage || null,
    media: Array.isArray(ch.media) ? ch.media : [],
    visibility: ["public", "followers", "private"].includes(ch.visibility)
      ? ch.visibility
      : "private",
    stories: Array.isArray(ch.stories)
      ? ch.stories.map((s) => ({
          title: s.title || "",
          storyType: s.storyType || "experience",
          content: s.content || "",
          dateLabel: s.dateLabel || "",
          location: s.location || "",
          media: Array.isArray(s.media) ? s.media : [],
          visibility: s.visibility || null,
          status: s.status === "published" ? "published" : "draft",
        }))
      : [],
    order: idx,
  }));

  return Story.create({
    author: authorId,
    authorProfession: authorDoc?.profession
      ? authorDoc.profession.toLowerCase()
      : null,
    title: cleanTitle,
    visibility,
    language,
    summary: summary?.trim?.() || "",
    chapters: finalChapters,
    coverImage,
    status: "draft",
  });
}

/**
 * Updates lifebook metadata and/or chapters. Authors have full control —
 * editing is allowed in any state, including published lifebooks.
 */
export async function updateStory({ authorId, storyId, body, file }) {
  const story = await findOwnedStory({ authorId, storyId });

  let { title, visibility, language, summary, status } = body;

  if (body.chapters !== undefined) {
    const chaptersUpdate = parseMaybeJson(body.chapters) ?? [];
    story.chapters = (Array.isArray(chaptersUpdate) ? chaptersUpdate : []).map(
      (ch, idx) => ({
        ...(ch._id ? { _id: ch._id } : {}),
        title: ch.title || `Chapter ${idx + 1}`,
        description: ch.description || "",
        coverImage: ch.coverImage || null,
        media: Array.isArray(ch.media) ? ch.media : [],
        visibility: ["public", "followers", "private"].includes(ch.visibility)
          ? ch.visibility
          : "private",
        stories: Array.isArray(ch.stories)
          ? ch.stories.map((s) => ({
              ...(s._id ? { _id: s._id } : {}),
              title: s.title || "",
              storyType: s.storyType || "experience",
              content: s.content || "",
              dateLabel: s.dateLabel || "",
              location: s.location || "",
              media: Array.isArray(s.media) ? s.media : [],
              visibility: s.visibility ?? null,
              status: s.status === "published" ? "published" : "draft",
            }))
          : [],
        order: idx,
      }),
    );
  }

  if (title !== undefined) story.title = title.trim();
  if (visibility !== undefined) story.visibility = visibility;
  if (language !== undefined) story.language = language;
  if (summary !== undefined) story.summary = summary?.trim?.() || "";
  if (status !== undefined && ["draft", "published"].includes(status)) {
    story.status = status;
  }

  if (file) {
    const uploaded = await uploadStoryImage(file.buffer);
    story.coverImage = { url: uploaded.url, publicId: uploaded.publicId };
  }

  await story.save();

  return story;
}

/**
 * Deletes a lifebook. Authors have full control — deletion is allowed in
 * any state, including published lifebooks.
 */
export async function deleteStory({ authorId, storyId }) {
  const story = await findOwnedStory({ authorId, storyId });

  await story.deleteOne();
}

/**
 * Drafts (anything not published) for the logged-in author.
 */
export async function listDrafts({ authorId, page, limit }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Number(limit) || 20, 50);

  const filter = { author: authorId, status: { $ne: "published" } };

  const [stories, total] = await Promise.all([
    Story.find(filter)
      .sort({ updatedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Story.countDocuments(filter),
  ]);

  return {
    stories,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * A single lifebook by id or slug, with the viewer's like/follow state.
 * Non-owners only see published lifebooks, and only chapters/stories
 * their access level allows (public / followers / private).
 */
export async function getStoryDetail({ storyId, viewer }) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(storyId);
  const filter = isObjectId ? { _id: storyId } : { slug: storyId };

  const story = await Story.findOne(filter)
    .populate("author", AUTHOR_POPULATE)
    .lean();

  if (!story) {
    throw new NotFoundError("Story not found.");
  }

  const isOwner =
    viewer?.id && story.author?._id?.toString() === viewer.id.toString();

  // Access check: Owner sees all states, public requester only sees
  // published & public lifebooks
  if (!isOwner) {
    if (story.status !== "published" || story.visibility !== "public") {
      throw new ForbiddenError("You do not have permission to view this story.");
    }
  }

  // Filter chapters and stories by visibility for non-owners
  if (!isOwner) {
    const allowedVis = PUBLIC_VISIBILITIES;

    if (story.chapters) {
      story.chapters = story.chapters
        .filter((ch) => allowedVis.includes(ch.visibility))
        .map((ch) => {
          if (ch.stories) {
            ch.stories = ch.stories.filter(
              (s) =>
                s.status === "published" &&
                (!s.visibility || allowedVis.includes(s.visibility)),
            );
          }
          return ch;
        })
        .filter((ch) => (ch.stories?.length || 0) > 0 || ch.media?.length > 0);
    }
  }

  let likedByUser = false;
  let followingAuthor = false;

  if (viewer?.id) {
    const existingLike = await Like.findOne({
      story: story._id,
      user: viewer.id,
    });
    likedByUser = Boolean(existingLike);

    if (viewer.role === "user") {
      const followExists = await Follow.findOne({
        who: viewer.id,
        whom: story.author?._id || story.author,
      });
      followingAuthor = Boolean(followExists);
    }
  }

  return { ...story, likedByUser, followingAuthor };
}

/**
 * Published, public feed, optionally filtered by author / profession.
 */
export async function listStories({ query: queryParams, viewer }) {
  const { type, author, profession, q } = queryParams;

  const page = Math.max(Number(queryParams.page) || 1, 1);
  const limit =
    type === "latest" || type === "trending"
      ? 10
      : Math.min(Number(queryParams.limit) || 20, 50);

  const filter = { status: "published", visibility: "public" };

  if (author) filter.author = author;

  if (profession?.trim()) {
    filter.authorProfession = new RegExp(
      `^${escapeRegex(profession.trim().toLowerCase())}$`,
      "i",
    );
  }

  let query = Story.find(filter)
    .select(
      `
        title
        slug
        summary
        chapters.title
        chapters.order
        chapters.visibility
        chapters.stories.title
        chapters.stories.storyType
        coverImage
        author
        authorProfession
        language
        featured
        stats
        recentLikers
        publishedAt
        createdAt
      `,
    )
    .populate("author", AUTHOR_POPULATE);

  switch (type) {
    case "trending":
      query = query.sort({
        "stats.likes": -1,
        "stats.comments": -1,
        publishedAt: -1,
      });
      break;

    case "latest":
    default:
      query = query.sort({ publishedAt: -1 });
  }

  const [stories, total] = await Promise.all([
    query
      .skip(type ? 0 : (page - 1) * limit)
      .limit(limit)
      .lean(),

    Story.countDocuments(filter),
  ]);

  // Simple in-memory text filter over title/summary/content
  const filtered = q?.trim()
    ? stories.filter((story) => textMatches(story, q.trim()))
    : stories;

  const followingMap = {};
  const likedMap = {};

  if (viewer?.id && viewer.role === "user" && filtered.length) {
    const storyIds = filtered.map((story) => story._id);
    const authorIds = filtered
      .map((story) => story.author?._id)
      .filter(Boolean);

    const [follows, likes] = await Promise.all([
      Follow.find({ who: viewer.id, whom: { $in: authorIds } })
        .select("whom")
        .lean(),

      Like.find({ user: viewer.id, story: { $in: storyIds } })
        .select("story")
        .lean(),
    ]);

    follows.forEach((follow) => {
      followingMap[follow.whom.toString()] = true;
    });

    likes.forEach((like) => {
      likedMap[like.story.toString()] = true;
    });
  }

  const enrichedStories = filtered.map((story) => ({
    ...story,
    followingAuthor: followingMap[story.author?._id?.toString()] ?? false,
    likedByUser: likedMap[story._id.toString()] ?? false,
  }));

  return {
    stories: enrichedStories,
    pagination: {
      page: type ? 1 : page,
      limit,
      total,
      pages: type ? 1 : Math.ceil(total / limit),
    },
  };
}

/* ---------- Chapters ---------- */

export async function addChapter({ authorId, storyId, body }) {
  const story = await findOwnedStory({ authorId, storyId });

  const { title, description, coverImage, media, visibility } = body;

  if (!title?.trim()) {
    throw new ValidationError("Chapter title is required.");
  }

  story.chapters.push({
    title: title.trim(),
    description: description || "",
    coverImage: coverImage || null,
    media: Array.isArray(media) ? media : [],
    visibility: ["public", "followers", "private"].includes(visibility)
      ? visibility
      : "private",
    stories: [],
    order: story.chapters.length,
  });

  await story.save();

  return story;
}

export async function updateChapter({ authorId, storyId, chapterId, body }) {
  const story = await findOwnedStory({ authorId, storyId });

  const chapter = story.chapters.id(chapterId);
  if (!chapter) {
    throw new NotFoundError("Chapter not found.");
  }

  const { title, description, coverImage, media, visibility } = body;

  if (title !== undefined) chapter.title = title.trim();
  if (description !== undefined) chapter.description = description;
  if (coverImage !== undefined) chapter.coverImage = coverImage;
  if (media !== undefined) chapter.media = media;
  if (visibility !== undefined) {
    if (!["public", "followers", "private"].includes(visibility)) {
      throw new ValidationError("Invalid visibility value.");
    }
    chapter.visibility = visibility;
  }

  await story.save();

  return story;
}

export async function deleteChapter({ authorId, storyId, chapterId }) {
  const story = await findOwnedStory({ authorId, storyId });

  if (story.chapters.length <= 1) {
    throw new ValidationError(
      "Cannot delete the last chapter. Stories must have at least one chapter.",
    );
  }

  const chapter = story.chapters.id(chapterId);
  if (!chapter) {
    throw new NotFoundError("Chapter not found.");
  }

  story.chapters.pull(chapterId);
  story.chapters.forEach((ch, idx) => {
    ch.order = idx;
  });

  await story.save();

  return story;
}

export async function reorderChapters({ authorId, storyId, chapterIds }) {
  if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
    throw new ValidationError("chapterIds array is required.");
  }

  const story = await findOwnedStory({ authorId, storyId });

  const storyChapterIds = story.chapters.map((ch) => ch._id.toString());
  const allExist = chapterIds.every((id) => storyChapterIds.includes(id));
  if (!allExist || chapterIds.length !== storyChapterIds.length) {
    throw new ValidationError(
      "Invalid chapter order — all chapters must be included.",
    );
  }

  const reordered = chapterIds.map((id, idx) => {
    const chapter = story.chapters.id(id);
    chapter.order = idx;
    return chapter;
  });

  story.chapters = reordered;
  await story.save();

  return story;
}

/* ---------- Chapter stories (individual memories / lessons / etc.) ---------- */

/**
 * Validates story fields sent for create/update.
 */
function sanitizeStoryInput(body = {}) {
  const errors = [];

  if (body.title === undefined || !String(body.title).trim()) {
    errors.push("Story title is required.");
  }

  const storyType = body.storyType || "experience";
  if (
    !["experience", "achievement", "challenge", "memory", "lesson", "other"].includes(
      storyType,
    )
  ) {
    errors.push("Invalid story type.");
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(" "));
  }

  return {
    title: String(body.title).trim(),
    storyType,
    content: body.content || "",
    dateLabel: body.dateLabel || "",
    location: body.location || "",
    media: Array.isArray(body.media) ? body.media : [],
    visibility: ["public", "followers", "private"].includes(body.visibility)
      ? body.visibility
      : null,
  };
}

/**
 * Adds a story to a chapter. Optionally publish it immediately.
 */
export async function addChapterStory({ authorId, storyId, chapterId, body }) {
  const story = await findOwnedStory({ authorId, storyId });

  const chapter = story.chapters.id(chapterId);
  if (!chapter) {
    throw new NotFoundError("Chapter not found.");
  }

  const input = sanitizeStoryInput(body);
  const publish = body.publish === true || body.status === "published";

  chapter.stories.push({
    ...input,
    status: publish ? "published" : "draft",
    publishedAt: publish ? new Date() : null,
  });

  // Publishing a story publishes the lifebook
  if (publish && story.status !== "published") {
    story.status = "published";
  }

  await story.save();

  return story;
}

export async function updateChapterStory({
  authorId,
  storyId,
  chapterId,
  storyEntryId,
  body,
}) {
  const story = await findOwnedStory({ authorId, storyId });

  const chapter = story.chapters.id(chapterId);
  if (!chapter) {
    throw new NotFoundError("Chapter not found.");
  }

  const entry = chapter.stories.id(storyEntryId);
  if (!entry) {
    throw new NotFoundError("Story not found in this chapter.");
  }

  const input = sanitizeStoryInput({ ...body, title: body.title ?? entry.title });

  entry.title = input.title;
  entry.storyType = input.storyType;
  entry.content = input.content;
  entry.dateLabel = input.dateLabel;
  entry.location = input.location;
  entry.media = input.media;
  entry.visibility = input.visibility;

  const publish = body.publish === true || body.status === "published";
  const unpublish = body.status === "draft";

  if (publish) {
    entry.status = "published";
    if (!entry.publishedAt) entry.publishedAt = new Date();
    if (story.status !== "published") story.status = "published";
  } else if (unpublish) {
    entry.status = "draft";
  }

  await story.save();

  return story;
}

export async function deleteChapterStory({
  authorId,
  storyId,
  chapterId,
  storyEntryId,
}) {
  const story = await findOwnedStory({ authorId, storyId });

  const chapter = story.chapters.id(chapterId);
  if (!chapter) {
    throw new NotFoundError("Chapter not found.");
  }

  const entry = chapter.stories.id(storyEntryId);
  if (!entry) {
    throw new NotFoundError("Story not found in this chapter.");
  }

  chapter.stories.pull(storyEntryId);

  await story.save();

  return story;
}

/* ---------- Publishing ---------- */

/**
 * Publishes the whole lifebook synchronously — no review pipeline,
 * the author has full control. Also re-publishes published lifebooks.
 */
export async function publishStory({ authorId, storyId, body }) {
  const story = await findOwnedStory({ authorId, storyId });

  if (!story.title?.trim()) {
    throw new ValidationError("Story title is required before publishing.");
  }

  if (!story.chapters || story.chapters.length === 0) {
    throw new ValidationError("Story must have at least one chapter.");
  }

  // Sync denormalized profession in case author updated profile
  const authorDoc = await Author.findById(story.author)
    .select("profession")
    .lean();
  if (authorDoc?.profession) {
    story.authorProfession = authorDoc.profession.toLowerCase();
  }

  // Optional visibility change at publish time
  if (body?.visibility) {
    if (!["public", "followers", "private"].includes(body.visibility)) {
      throw new ValidationError("Invalid visibility value.");
    }
    story.visibility = body.visibility;
  }

  story.status = "published";

  // Mark all chapter stories published too
  story.chapters.forEach((chapter) => {
    chapter.stories.forEach((entry) => {
      entry.status = "published";
      if (!entry.publishedAt) entry.publishedAt = new Date();
    });
  });

  await story.save();

  return {
    id: story.id,
    status: story.status,
    visibility: story.visibility,
  };
}

/**
 * Unpublishes a lifebook back to draft — full author control.
 */
export async function unpublishStory({ authorId, storyId }) {
  const story = await findOwnedStory({ authorId, storyId });

  story.status = "draft";
  story.chapters.forEach((chapter) => {
    chapter.stories.forEach((entry) => {
      entry.status = "draft";
    });
  });

  await story.save();

  return { id: story.id, status: story.status };
}

/* ---------- Likes ---------- */

export async function toggleLike({ storyId, userId }) {
  const story = await Story.findOne({
    _id: storyId,
    status: "published",
    visibility: "public",
  }).select("_id author");

  if (!story) {
    throw new NotFoundError("Story not found.");
  }

  const existing = await Like.findOne({ story: storyId, user: userId });

  if (existing) {
    await Promise.all([
      existing.deleteOne(),
      Story.findByIdAndUpdate(storyId, {
        $inc: { "stats.likes": -1 },
        $pull: { recentLikers: { user: userId } },
      }),
      Author.findByIdAndUpdate(story.author, {
        $inc: { "stats.likes": -1 },
      }),
    ]);

    return { liked: false };
  }

  const userDoc = await User.findById(userId).select("fullName").lean();

  await Promise.all([
    Like.create({ story: storyId, user: userId }),
    Story.findByIdAndUpdate(storyId, {
      $inc: { "stats.likes": 1 },
      $push: {
        recentLikers: {
          $each: [{ user: userId, fullName: userDoc?.fullName || "User" }],
          $position: 0,
          $slice: 3,
        },
      },
    }),
    Author.findByIdAndUpdate(story.author, {
      $inc: { "stats.likes": 1 },
    }),
  ]);

  // Notify the author (best-effort, never blocks the like)
  createNotification({
    recipient: story.author,
    type: "like",
    actor: userId,
    actorName: userDoc?.fullName || "A reader",
    story: story._id,
    preview: "liked your lifebook",
  });

  return { liked: true };
}

export async function listLikes({ storyId }) {
  return Like.find({ story: storyId })
    .populate("user", "fullName avatar")
    .sort({ createdAt: -1 })
    .lean();
}

/* ---------- Comments ---------- */

export async function createComment({ storyId, userId, content }) {
  if (!content?.trim()) {
    throw new ValidationError("Comment cannot be empty.");
  }

  const story = await Story.findOne({
    _id: storyId,
    status: "published",
    visibility: "public",
  }).select("_id");

  if (!story) {
    throw new NotFoundError("Story not found.");
  }

  const comment = await Comment.create({
    story: storyId,
    user: userId,
    content: content.trim(),
  });

  // Notify the story's author (best-effort)
  const [userDoc, storyAuthor] = await Promise.all([
    User.findById(userId).select("fullName").lean(),
    Story.findById(storyId).select("author slug").lean(),
  ]);

  createNotification({
    recipient: storyAuthor?.author,
    type: "comment",
    actor: userId,
    actorName: userDoc?.fullName || "A reader",
    story: storyId,
    storySlug: storyAuthor?.slug || "",
    preview: content.trim().slice(0, 200),
  });

  await Story.findByIdAndUpdate(storyId, { $inc: { "stats.comments": 1 } });

  return Comment.findById(comment.id)
    .populate("user", "fullName avatar")
    .lean();
}

export async function updateComment({ commentId, userId, content }) {
  if (!content?.trim()) {
    throw new ValidationError("Comment cannot be empty.");
  }

  const comment = await Comment.findOne({ _id: commentId, user: userId });

  if (!comment) {
    throw new NotFoundError("Comment not found.");
  }

  comment.content = content.trim();
  comment.edited = true;

  await comment.save();

  return comment;
}

export async function deleteComment({ commentId, userId }) {
  const comment = await Comment.findOne({ _id: commentId, user: userId });

  if (!comment) {
    throw new NotFoundError("Comment not found.");
  }

  await Promise.all([
    comment.deleteOne(),
    Story.findByIdAndUpdate(comment.story, { $inc: { "stats.comments": -1 } }),
  ]);
}

export async function listComments({ storyId, page, limit }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Number(limit) || 20, 50);

  const [comments, total] = await Promise.all([
    Comment.find({ story: storyId })
      .populate("user", "fullName avatar")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    Comment.countDocuments({ story: storyId }),
  ]);

  return {
    comments,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

/* ---------- Search helpers (used by the search module) ---------- */

/**
 * Simple text search over published public lifebooks: title, summary,
 * chapter titles/descriptions and story content. Replaces the old
 * Qdrant semantic search.
 */
export async function searchStories({ q, limit = 20 }) {
  const query = q?.trim() || "";
  if (!query) return [];

  const safeLimit = Math.min(Number(limit) || 20, 50);

  const rx = new RegExp(escapeRegex(query), "i");

  const stories = await Story.find({
    status: "published",
    visibility: "public",
    $or: [
      { title: rx },
      { summary: rx },
      { "chapters.title": rx },
      { "chapters.description": rx },
      { "chapters.stories.title": rx },
      { "chapters.stories.content": rx },
    ],
  })
    .select(
      `
        title
        slug
        summary
        chapters.title
        chapters.order
        chapters.visibility
        chapters.stories.title
        chapters.stories.storyType
        coverImage
        author
        authorProfession
        stats
        publishedAt
        createdAt
      `,
    )
    .populate(
      "author",
      "fullName username avatar profession verification.status",
    )
    .limit(safeLimit)
    .lean();

  return stories;
}
