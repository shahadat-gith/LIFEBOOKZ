import Story from "./models/Story.js";
import Like from "./models/Like.js";
import Comment from "./models/Comment.js";
import Follow from "../following/model.js";
import Author from "../author/model.js";
import { createNotification, createNotificationsForMany } from "../notification/service.js";

import { uploadStoryImage } from "../../core/services/upload.js";
import { sanitizeHtml } from "../../core/utils/sanitizeHtml.js";
import { getSettings } from "../author/settings.service.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../../core/utils/errors.js";

const AUTHOR_POPULATE =
  "fullName username avatar profession verification.status";

const PUBLIC_VISIBILITIES = ["public"];

const VISIBILITY_LEVELS = ["public", "followers", "private"];

/** Upper bound on sanitized rich-text story content, in characters. */
const MAX_CONTENT_LENGTH = 200000;

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
 * Simple text search across title and story content.
 */
function textMatches(story, query) {
  const q = query.toLowerCase();
  if (story.title?.toLowerCase().includes(q)) return true;
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

/**
 * Media descriptors stored on chapters and story entries. Photos and videos
 * only — media is uploaded by the client straight to R2 via presigned URLs
 * (modules/story/media.controller.js); the server only ever stores the
 * resulting URL + key.
 */
const ALLOWED_MEDIA_TYPES = ["image", "video"];

/**
 * Validate/normalize a media descriptor list sent from the client.
 */
export function sanitizeMediaList(media) {
  if (!Array.isArray(media)) return [];

  return media
    .filter((m) => m && typeof m === "object" && m.url)
    .map((m) => ({
      url: String(m.url),
      key: m.key || "",
      type: ALLOWED_MEDIA_TYPES.includes(m.type) ? m.type : "image",
      caption: typeof m.caption === "string" ? m.caption.trim() : "",
    }));
}

/* ---------- Stories (lifebooks) ---------- */

/**
 * Creates a lifebook, optionally seeding the first chapter.
 */
export async function createStory({ authorId, body, file }) {
  let chapters = parseMaybeJson(body.chapters) ?? [];
  if (!Array.isArray(chapters)) chapters = [];

  const { title = "", language = "English" } = body;
  const cleanTitle = title?.trim() || "";

  // An explicit, valid visibility wins; otherwise the lifebook opens with the
  // author's default (a preference they set in settings).
  const authorSettings = await getSettings(authorId);
  const visibility = VISIBILITY_LEVELS.includes(body.visibility)
    ? body.visibility
    : authorSettings.defaultVisibility;

  let coverImage = null;
  if (file) {
    const uploaded = await uploadStoryImage(file.buffer, file.mimetype);
    coverImage = { url: uploaded.url, key: uploaded.key };
  }

  const authorDoc = await Author.findById(authorId)
    .select("profession")
    .lean();

  const finalChapters = chapters.map((ch, idx) => ({
    title: ch.title || `Chapter ${idx + 1}`,
    description: ch.description || "",
    coverImage: ch.coverImage || null,
    media: sanitizeMediaList(ch.media),
    visibility: VISIBILITY_LEVELS.includes(ch.visibility)
      ? ch.visibility
      : "private",
    stories: Array.isArray(ch.stories)
      ? ch.stories.map((s) => ({
          title: s.title || "",
          storyType: s.storyType || "experience",
          content: sanitizeHtml(s.content || ""),
          dateLabel: s.dateLabel || "",
          location: s.location || "",
          media: sanitizeMediaList(s.media),
          visibility: VISIBILITY_LEVELS.includes(s.visibility)
            ? s.visibility
            : null,
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

  let { title, visibility, language, status } = body;

  if (body.chapters !== undefined) {
    const chaptersUpdate = parseMaybeJson(body.chapters) ?? [];
    story.chapters = (Array.isArray(chaptersUpdate) ? chaptersUpdate : []).map(
      (ch, idx) => ({
        ...(ch._id ? { _id: ch._id } : {}),
        title: ch.title || `Chapter ${idx + 1}`,
        description: ch.description || "",
        coverImage: ch.coverImage || null,
        media: sanitizeMediaList(ch.media),
        visibility: VISIBILITY_LEVELS.includes(ch.visibility)
          ? ch.visibility
          : "private",
        stories: Array.isArray(ch.stories)
          ? ch.stories.map((s) => ({
              ...(s._id ? { _id: s._id } : {}),
              title: s.title || "",
              storyType: s.storyType || "experience",
              // Rich-text content is sanitized on this path too — the
              // wizard saves the whole lifebook in one PATCH.
              content: sanitizeHtml(s.content || ""),
              dateLabel: s.dateLabel || "",
              location: s.location || "",
              media: sanitizeMediaList(s.media),
              // "Inherit chapter visibility" is expressed as an empty value
              // by the client; the schema only accepts the three levels or
              // null, so anything else becomes null.
              visibility: VISIBILITY_LEVELS.includes(
                s.visibility,
              )
                ? s.visibility
                : null,
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
  if (status !== undefined && ["draft", "published"].includes(status)) {
    story.status = status;
  }

  if (file) {
    const uploaded = await uploadStoryImage(file.buffer, file.mimetype);
    story.coverImage = { url: uploaded.url, key: uploaded.key };
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

    // Anyone signed in can follow an author, so the follow state is checked
    // for readers, authors and experts alike.
    const followExists = await Follow.findOne({
      who: viewer.id,
      whom: story.author?._id || story.author,
    });
    followingAuthor = Boolean(followExists);
  }

  return { ...story, likedByUser, followingAuthor };
}

/**
 * Published, public feed with filters: author profession, author name,
 * author gender, and "only authors I follow". `q` text search is no
 * longer part of this endpoint (search was removed).
 */
export async function listStories({ query: queryParams, viewer }) {
  const { type, author, profession, authorName, gender, following } = queryParams;

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

  // Author name filter — case-insensitive partial match on fullName/username
  if (authorName?.trim()) {
    const nameRx = new RegExp(escapeRegex(authorName.trim()), "i");
    const matchingAuthors = await Author.find({
      $or: [{ fullName: nameRx }, { username: nameRx }],
    })
      .select("_id")
      .lean();
    filter.author = { ...(filter.author || {}), $in: matchingAuthors.map((a) => a._id) };
  }

  // Author gender filter
  if (gender && ["Male", "Female", "Other"].includes(gender)) {
    const genderAuthors = await Author.find({ gender })
      .select("_id")
      .lean();
    filter.author = { ...(filter.author || {}), $in: genderAuthors.map((a) => a._id) };
  }

  // Only show lifebooks from authors the viewer follows
  if (following === "true" && viewer?.id) {
    const follows = await Follow.find({ who: viewer.id }).select("whom").lean();
    const followedIds = follows.map((f) => f.whom);
    const authorFilter = filter.author || {};
    if (authorFilter.$in) {
      // Intersect with other author filters (name/gender)
      const allowed = new Set(followedIds.map(String));
      authorFilter.$in = authorFilter.$in.filter((id) => allowed.has(String(id)));
    } else {
      authorFilter.$in = followedIds;
    }
    filter.author = authorFilter;
  }

  let query = Story.find(filter)
    .select(
      `
        title
        slug
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

  const followingMap = {};
  const likedMap = {};

  if (viewer?.id && stories.length) {
    const storyIds = stories.map((story) => story._id);
    const authorIds = stories
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

  const enrichedStories = stories.map((story) => ({
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
    visibility: VISIBILITY_LEVELS.includes(visibility)
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
    if (!VISIBILITY_LEVELS.includes(visibility)) {
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

  // Story content is authored rich text — sanitize before it is stored.
  const content = sanitizeHtml(body.content || "");
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new ValidationError("Story content is too long.");
  }

  return {
    title: String(body.title).trim(),
    storyType,
    content,
    dateLabel: body.dateLabel || "",
    location: body.location || "",
    media: sanitizeMediaList(body.media),
    visibility: VISIBILITY_LEVELS.includes(body.visibility)
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
    if (!VISIBILITY_LEVELS.includes(body.visibility)) {
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

  // Notify the author's followers (best-effort, never blocks publishing)
  try {
    const [authorDoc, followers] = await Promise.all([
      Author.findById(story.author).select("fullName").lean(),
      Follow.find({ whom: story.author }).select("who whoModel").lean(),
    ]);

    const authorName = authorDoc?.fullName || "An author";
    // Followers can be readers, other authors or experts — notify each one
    // through their own account model.
    const followersToNotify = (body?.visibility === "public" ? followers : [])
      .map((f) => ({ id: f.who, model: f.whoModel || "User" }));

    await createNotificationsForMany(followersToNotify, {
      type: "publish",
      actor: { id: story.author, model: "Author", name: authorName },
      title: "New story published",
      preview: `${authorName} published a new lifebook: "${story.title}"`,
    });
  } catch (err) {
    // Publishing must never fail because of notifications.
  }

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

/**
 * Like / unlike a story. Any signed-in account can like — the caller's
 * collection and display name are recorded so the like renders correctly
 * whatever kind of account it came from.
 */
export async function toggleLike({
  storyId,
  userId,
  userModel = "User",
  fullName = "A reader",
}) {
  const story = await Story.findOne({
    _id: storyId,
    status: "published",
    visibility: "public",
  }).select("_id author slug");

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

  await Promise.all([
    Like.create({ story: storyId, user: userId, userModel }),
    Story.findByIdAndUpdate(storyId, {
      $inc: { "stats.likes": 1 },
      $push: {
        recentLikers: {
          $each: [{ user: userId, fullName }],
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
    recipient: { id: story.author, model: "Author" },
    type: "like",
    actor: { id: userId, model: userModel, name: fullName },
    preview: "liked your lifebook",
    link: story.slug ? `/feed/story/${story.slug}` : "",
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

/**
 * Flatten a populated reply for rendering.
 *
 * Replies store only the author's id; the name and avatar are populated on
 * every read, so a reply always carries the author's current profile — and
 * the clients keep reading the same `fullName` / `avatar` fields.
 */
function shapeReply(reply) {
  const author = reply.author && typeof reply.author === "object" ? reply.author : null;

  return {
    ...reply,
    author: author?._id || reply.author,
    fullName: author?.fullName || "Author",
    avatar: author?.avatar?.url || "",
  };
}

/** Populate every account reference on a comment, then flatten its replies. */
function commentPopulate(query) {
  return query
    .populate("user", "fullName avatar")
    .populate("replies.author", "fullName avatar");
}

/** Shape one comment (and its replies) for the clients. */
function shapeComment(comment) {
  return {
    ...comment,
    // Populate resolves through `refPath` for every account type; a guard
    // keeps a malformed row from breaking the whole comment list.
    user: comment.user || { _id: null, fullName: "A reader", avatar: { url: "" } },
    replies: (comment.replies || []).map(shapeReply),
  };
}

/**
 * Comment on a story. Readers, authors and experts can all comment — the
 * account type and a copy of the display name travel with the row.
 */
export async function createComment({
  storyId,
  userId,
  userModel = "User",
  // Used for the notification only — the comment itself stores just the id.
  fullName = "A reader",
  content,
}) {
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
    userModel,
    content: content.trim(),
  });

  // Notify the story's author (best-effort)
  const storyAuthor = await Story.findById(storyId).select("author slug").lean();

  createNotification({
    recipient: { id: storyAuthor?.author, model: "Author" },
    type: "comment",
    actor: { id: userId, model: userModel, name: fullName },
    preview: content.trim().slice(0, 200),
    link: storyAuthor?.slug ? `/feed/story/${storyAuthor.slug}` : "",
    // Lets the author reply to this comment from the notification drawer.
    commentId: comment._id,
  });

  await Story.findByIdAndUpdate(storyId, { $inc: { "stats.comments": 1 } });

  const saved = await commentPopulate(Comment.findById(comment.id)).lean();

  return shapeComment(saved);
}

export async function updateComment({
  commentId,
  userId,
  userModel = "User",
  content,
}) {
  if (!content?.trim()) {
    throw new ValidationError("Comment cannot be empty.");
  }

  const comment = await Comment.findOne({ _id: commentId, user: userId, userModel });

  if (!comment) {
    throw new NotFoundError("Comment not found.");
  }

  comment.content = content.trim();
  comment.edited = true;

  await comment.save();

  return comment;
}

export async function deleteComment({ commentId, userId, userModel = "User" }) {
  const comment = await Comment.findOne({ _id: commentId, user: userId, userModel });

  if (!comment) {
    throw new NotFoundError("Comment not found.");
  }

  await Promise.all([
    comment.deleteOne(),
    Story.findByIdAndUpdate(comment.story, { $inc: { "stats.comments": -1 } }),
  ]);
}

export async function listComments({ storyId, page, limit, viewerId, viewerModel }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Number(limit) || 20, 50);

  const [comments, total] = await Promise.all([
    commentPopulate(Comment.find({ story: storyId }))
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    Comment.countDocuments({ story: storyId }),
  ]);

  const viewerIdStr = viewerId ? String(viewerId) : null;

  return {
    comments: comments.map((c) => ({
      ...shapeComment(c),
      likeCount: c.likes?.length || 0,
      likedByMe:
        viewerIdStr && c.likes
          ? c.likes.some((l) => String(l.who) === viewerIdStr)
          : false,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Toggle a like on a comment. Any signed-in account (user, author or
 * expert) can like comments.
 */
export async function toggleCommentLike({ commentId, whoId, whoModel }) {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new NotFoundError("Comment not found.");
  }

  const existing = comment.likes.find(
    (l) => String(l.who) === String(whoId),
  );

  if (existing) {
    comment.likes = comment.likes.filter(
      (l) => String(l.who) !== String(whoId),
    );
  } else {
    comment.likes.push({ who: whoId, whoModel: whoModel || "User" });
  }

  await comment.save();

  return {
    liked: !existing,
    likeCount: comment.likes.length,
  };
}

/**
 * Reply to a comment — story author only (route + ownership both enforced).
 */
export async function replyToComment({ commentId, authorId, content }) {
  if (!content?.trim()) {
    throw new ValidationError("Reply cannot be empty.");
  }

  const comment = await Comment.findById(commentId).populate(
    "story",
    "author",
  );

  if (!comment) {
    throw new NotFoundError("Comment not found.");
  }

  if (String(comment.story.author) !== String(authorId)) {
    throw new ForbiddenError(
      "Only the story's author can reply to comments.",
    );
  }

  comment.replies.push({ author: authorId, content: content.trim() });

  await comment.save();

  // Re-read so the reply carries the author's current name and avatar.
  const saved = await commentPopulate(
    Comment.findById(commentId).select("replies"),
  ).lean();

  const replies = saved?.replies || [];
  return shapeReply(replies[replies.length - 1]);
}

/* ---------- Search helpers (used by the search module) ---------- */

/**
 * Simple text search over published public lifebooks: title,
 * chapter titles/descriptions and story content.
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
