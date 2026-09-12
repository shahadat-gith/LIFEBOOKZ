import Story from "./models/Story.js";
import Like from "./models/Like.js";
import Comment from "./models/Comment.js";
import Follow from "../following/model.js";
import Author from "../author/model.js";
import User from "../user/model.js";

import { uploadStoryImage } from "../../core/services/upload.js";
import { publishMessage } from "../../core/queue/publishers.js";
import { generateContent } from "../../core/services/llm.js";
import { getStoryAnalysisPrompt } from "../../core/prompts/story.js";
import {
  extractTextFromDocument,
  parseJsonFromLLM,
} from "../../core/utils/helpers.js";
import config from "../../core/config/index.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../../core/utils/errors.js";

// Statuses during which the author may not edit chapters.
const IN_REVIEW_STATUSES = [
  "submitted",
  "analyzing",
  "verified",
  "enriching",
  "enriched",
];

const AUTHOR_POPULATE =
  "fullName username avatar profession verification.status";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
 * Extract combined plain text from all chapters (or legacy content).
 */
function extractAllContentText(story) {
  if (story.chapters && story.chapters.length > 0) {
    return story.chapters
      .sort((a, b) => a.order - b.order)
      .map((ch) => extractTextFromDocument(ch.content))
      .join("\n\n");
  }
  return extractTextFromDocument(story.content);
}

async function findOwnedStory({ authorId, storyId }) {
  const story = await Story.findOne({ _id: storyId, author: authorId });

  if (!story) {
    throw new NotFoundError("Story not found.");
  }

  return story;
}

function assertEditable(story) {
  if (IN_REVIEW_STATUSES.includes(story.status)) {
    throw new ValidationError(
      "Cannot edit story while it is in review processing.",
    );
  }
}

/* ---------- Media ---------- */

export async function uploadStoryAsset({ file }) {
  if (!file) {
    throw new ValidationError("No image file provided.");
  }

  const uploaded = await uploadStoryImage(file.buffer);

  return { url: uploaded.url, publicId: uploaded.publicId };
}

/* ---------- Stories ---------- */

/**
 * Creates a draft, optionally seeding the first chapter.
 */
export async function createStory({ authorId, body, file }) {
  // Parse chapter data if provided (JSON string from FormData)
  let chapters = parseMaybeJson(body.chapters) ?? [];
  if (!Array.isArray(chapters)) chapters = [];

  // Legacy single-content support
  let content = body.content || body.blocks;
  if (content !== undefined) {
    content = parseMaybeJson(content) ?? content;
  }

  const {
    title = "",
    storyType = "autobiography",
    language = "English",
    visibility = "public",
  } = body;
  const cleanTitle = title?.trim() || "";

  let coverImage = null;
  if (file) {
    const uploaded = await uploadStoryImage(file.buffer);
    coverImage = { url: uploaded.url, publicId: uploaded.publicId };
  }

  // Fetch author's profession for denormalized field
  const authorDoc = await Author.findById(authorId)
    .select("profession")
    .lean();

  // Build chapters array
  let finalChapters = [];
  if (chapters.length > 0) {
    finalChapters = chapters.map((ch, idx) => ({
      title: ch.title || `Chapter ${idx + 1}`,
      bannerImage: ch.bannerImage || null,
      caption: ch.caption || "",
      content: ch.content || { type: "doc", content: [] },
      order: idx,
    }));
  } else if (content) {
    // Backward compatibility: wrap legacy content as single chapter
    finalChapters = [
      { title: cleanTitle || "Chapter 1", content, order: 0 },
    ];
  }

  return Story.create({
    author: authorId,
    authorProfession: authorDoc?.profession
      ? authorDoc.profession.toLowerCase()
      : null,
    title: cleanTitle,
    storyType,
    visibility,
    language,
    chapters: finalChapters,
    content: content || { type: "doc", content: [] },
    coverImage,
    status: "draft",
    processing: { currentStep: "idle" },
  });
}

/**
 * Updates story metadata and/or chapters. Authors may update published
 * stories (e.g. to add chapters) but not ones under review.
 */
export async function updateStory({ authorId, storyId, body, file }) {
  const story = await findOwnedStory({ authorId, storyId });

  // Allow editing in draft, rejected, failed, OR published states
  assertEditable(story);

  let { title, storyType, visibility, language } = body;

  // Parse chapters update if provided
  let chaptersUpdate;
  if (body.chapters !== undefined) {
    chaptersUpdate = parseMaybeJson(body.chapters);
  }

  // Legacy content support
  let content = body.content || body.blocks;
  if (content !== undefined) {
    content = parseMaybeJson(content) ?? content;
  }

  if (content !== undefined) story.content = content;
  if (title !== undefined) story.title = title.trim();
  if (storyType !== undefined) story.storyType = storyType;
  if (visibility !== undefined) story.visibility = visibility;
  if (language !== undefined) story.language = language;

  if (chaptersUpdate !== undefined) {
    story.chapters = chaptersUpdate.map((ch, idx) => ({
      _id: ch._id || new story.model("Story").chapters.create()._id,
      title: ch.title || `Chapter ${idx + 1}`,
      bannerImage: ch.bannerImage || null,
      caption: ch.caption || "",
      content: ch.content || { type: "doc", content: [] },
      order: idx,
    }));
  }

  if (file) {
    const uploaded = await uploadStoryImage(file.buffer);
    story.coverImage = { url: uploaded.url, publicId: uploaded.publicId };
  }

  // Reset status back to draft if user is editing a rejected/failed submission
  if (["rejected", "failed"].includes(story.status)) {
    story.status = "draft";
    // Guard against legacy docs missing the processing sub-document
    if (!story.processing) story.processing = {};
    story.processing.currentStep = "idle";
    story.processing.error = "";
  }

  await story.save();

  return story;
}

export async function deleteStory({ authorId, storyId }) {
  const story = await findOwnedStory({ authorId, storyId });

  // Allowed only for draft, rejected, or failed
  if (!["draft", "rejected", "failed"].includes(story.status)) {
    throw new ValidationError(
      "Published or in-review stories cannot be deleted.",
    );
  }

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
      .select("-embeddingMetadata")
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
 * A single story by id or slug, with the viewer's like/follow state.
 * Non-owners only see published, public stories.
 */
export async function getStoryDetail({ storyId, viewer }) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(storyId);
  const filter = isObjectId ? { _id: storyId } : { slug: storyId };

  const story = await Story.findOne(filter)
    .select("-embeddingMetadata")
    .populate("author", AUTHOR_POPULATE)
    .lean();

  if (!story) {
    throw new NotFoundError("Story not found.");
  }

  const isOwner =
    viewer?.id && story.author?._id?.toString() === viewer.id.toString();

  // Access check: Owner sees all states, public requester only sees published & public
  if (!isOwner) {
    if (story.status !== "published" || story.visibility !== "public") {
      throw new ForbiddenError("You do not have permission to view this story.");
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
  const { type, author, profession } = queryParams;

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
        chapters
        coverImage
        author
        authorProfession
        storyType
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

  if (viewer?.id && viewer.role === "user" && stories.length) {
    const storyIds = stories.map((story) => story._id);
    const authorIds = stories.map((story) => story.author?._id).filter(Boolean);

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

  // Allow adding chapters to draft, rejected, failed, OR published stories
  assertEditable(story);

  const { title, bannerImage, caption, content } = body;

  if (!title?.trim()) {
    throw new ValidationError("Chapter title is required.");
  }

  story.chapters.push({
    title: title.trim(),
    bannerImage: bannerImage || null,
    caption: caption || "",
    content: content || { type: "doc", content: [] },
    order: story.chapters.length,
  });

  await story.save();

  return story;
}

export async function updateChapter({ authorId, storyId, chapterId, body }) {
  const story = await findOwnedStory({ authorId, storyId });

  assertEditable(story);

  const chapter = story.chapters.id(chapterId);
  if (!chapter) {
    throw new NotFoundError("Chapter not found.");
  }

  const { title, bannerImage, caption, content } = body;

  if (title !== undefined) chapter.title = title.trim();
  if (bannerImage !== undefined) chapter.bannerImage = bannerImage;
  if (caption !== undefined) chapter.caption = caption;
  if (content !== undefined) chapter.content = content;

  await story.save();

  return story;
}

export async function deleteChapter({ authorId, storyId, chapterId }) {
  const story = await findOwnedStory({ authorId, storyId });

  assertEditable(story);

  if (story.chapters.length <= 1) {
    throw new ValidationError(
      "Cannot delete the last chapter. Stories must have at least one chapter.",
    );
  }

  const chapter = story.chapters.id(chapterId);
  if (!chapter) {
    throw new NotFoundError("Chapter not found.");
  }

  // Remove the chapter and re-index orders
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

  assertEditable(story);

  // Validate all IDs exist in the story
  const storyChapterIds = story.chapters.map((ch) => ch._id.toString());
  const allExist = chapterIds.every((id) => storyChapterIds.includes(id));
  if (!allExist || chapterIds.length !== storyChapterIds.length) {
    throw new ValidationError(
      "Invalid chapter order — all chapters must be included.",
    );
  }

  // Reorder
  const reordered = chapterIds.map((id, idx) => {
    const chapter = story.chapters.id(id);
    chapter.order = idx;
    return chapter;
  });

  story.chapters = reordered;
  await story.save();

  return story;
}

/* ---------- Moderation & publishing ---------- */

/**
 * Synchronous pre-flight content moderation check.
 */
export async function verifyStory({ authorId, storyId }) {
  const story = await findOwnedStory({ authorId, storyId });

  const plainText = extractAllContentText(story);

  if (!plainText?.trim()) {
    throw new ValidationError(
      "Story content is empty; add some text before verifying.",
    );
  }

  const rawResponse = await generateContent({
    system: getStoryAnalysisPrompt(),
    prompt: `Title: ${story.title}\n\n${plainText}`,
    json: true,
  });

  const result = parseJsonFromLLM(rawResponse);

  story.analysis = {
    canProceed: !!result.canProceed,
    issues: Array.isArray(result.issues) ? result.issues : [],
    analyzedAt: new Date(),
    model: config.openrouter.chatModel || "",
  };

  await story.save();

  return {
    canProceed: story.analysis.canProceed,
    issues: story.analysis.issues,
    analysis: story.analysis,
  };
}

/**
 * Queues the moderation/enrichment pipeline. Also allows re-publishing
 * published stories after adding chapters.
 */
export async function publishStory({ authorId, storyId }) {
  const story = await findOwnedStory({ authorId, storyId });

  // Allow publishing drafts OR re-publishing published stories
  if (!["draft", "published"].includes(story.status)) {
    throw new ValidationError(
      "Only drafts or published stories can be submitted for publishing.",
    );
  }

  if (!story.title?.trim()) {
    throw new ValidationError("Story title is required before publishing.");
  }

  if (!story.chapters || story.chapters.length === 0) {
    throw new ValidationError("Story must have at least one chapter.");
  }

  // Check if at least one chapter has content
  const hasContent = story.chapters.some((ch) => {
    const ct = ch.content;
    if (!ct) return false;
    if (typeof ct === "string") return ct.trim().length > 0;
    if (Array.isArray(ct?.content)) return ct.content.length > 0;
    return Object.keys(ct).length > 0;
  });

  if (!hasContent) {
    throw new ValidationError("Story content cannot be empty.");
  }

  // Sync denormalized profession in case author updated profile
  const authorDoc = await Author.findById(story.author)
    .select("profession")
    .lean();
  if (authorDoc?.profession) {
    story.authorProfession = authorDoc.profession.toLowerCase();
  }

  // Update processing tracking state
  story.status = "submitted";
  story.processing = {
    startedAt: new Date(),
    completedAt: null,
    retries: 0,
    currentStep: "analysis",
    error: "",
  };

  await story.save();

  // Dispatch initial job to SQS matching worker expected schema
  await publishMessage({ jobType: "story_analysis", storyId: story.id });

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
