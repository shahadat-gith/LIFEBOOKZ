import Story from "./models/Story.js";
import Like from "./models/Like.js";
import Comment from "./models/Comment.js";
import Follow from "../following/model.js";
import Author from "../author/model.js";
import User from "../user/model.js";
import { uploadStoryImage } from "../shared/services/upload.js";
import { publishMessage } from "../shared/sqs/publishers.js";
import { generateContent } from "../shared/services/llm.js";
import { getStoryAnalysisPrompt } from "../shared/prompts/story.js";
import {
  extractTextFromDocument,
  parseJsonFromLLM,
} from "../shared/utils/helpers.js";
import config from "../shared/config/index.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../shared/utils/errors.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Upload Image Asset Helper
 */
export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      throw new ValidationError("No image file provided.");
    }

    const uploaded = await uploadStoryImage(req.file.buffer);

    res.json({
      success: true,
      data: {
        url: uploaded.url,
        publicId: uploaded.publicId,
      },
    });
  } catch (error) {
    next(error);
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

/**
 * POST /stories
 * Create Draft — creates story with initial chapter if provided
 */
export async function create(req, res, next) {
  try {
    // Parse chapter data if provided (JSON string from FormData)
    let chapters = [];
    if (req.body.chapters) {
      try {
        chapters = typeof req.body.chapters === "string"
          ? JSON.parse(req.body.chapters)
          : req.body.chapters;
      } catch {
        /* ignore malformed chapters */
      }
    }

    // Legacy single-content support
    let content = req.body.content || req.body.blocks;
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        /* keep raw string fallback */
      }
    }

    const {
      title = "",
      storyType = "autobiography",
      language = "English",
      visibility = "public",
    } = req.body;
    const cleanTitle = title?.trim() || "";

    let coverImage = null;
    if (req.file) {
      const uploaded = await uploadStoryImage(req.file.buffer);
      coverImage = { url: uploaded.url, publicId: uploaded.publicId };
    }

    // Fetch author's profession for denormalized field
    const authorDoc = await Author.findById(req.user.id)
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
        {
          title: cleanTitle || "Chapter 1",
          content: content,
          order: 0,
        },
      ];
    }

    const story = await Story.create({
      author: req.user.id,
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
      processing: {
        currentStep: "idle",
      },
    });

    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /stories/:storyId
 * Update Draft — supports updating story metadata and chapters
 */
export async function update(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    // Allow editing in draft, rejected, failed, OR published states
    // (authors can update published stories to add chapters)
    if (["submitted", "analyzing", "verified", "enriching", "enriched"].includes(story.status)) {
      throw new ValidationError(
        "Cannot edit story while it is in review processing.",
      );
    }

    let { title, storyType, visibility, language } = req.body;

    // Parse chapters update if provided
    let chaptersUpdate = undefined;
    if (req.body.chapters) {
      try {
        chaptersUpdate = typeof req.body.chapters === "string"
          ? JSON.parse(req.body.chapters)
          : req.body.chapters;
      } catch {
        /* ignore malformed chapters */
      }
    }

    // Legacy content support
    let content = req.body.content || req.body.blocks;
    if (content !== undefined && typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        /* keep raw string fallback */
      }
    }

    if (content !== undefined) {
      story.content = content;
    }

    if (title !== undefined) {
      story.title = title.trim();
    }

    if (storyType !== undefined) {
      story.storyType = storyType;
    }

    if (visibility !== undefined) {
      story.visibility = visibility;
    }

    if (language !== undefined) {
      story.language = language;
    }

    // Update chapters if provided
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

    if (req.file) {
      const uploaded = await uploadStoryImage(req.file.buffer);
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

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /stories/:storyId/chapters
 * Add a new chapter to a story
 */
export async function addChapter(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    // Allow adding chapters to draft, rejected, failed, OR published stories
    if (["submitted", "analyzing", "verified", "enriching", "enriched"].includes(story.status)) {
      throw new ValidationError(
        "Cannot add chapters while story is in review processing.",
      );
    }

    const { title, bannerImage, caption, content } = req.body;

    if (!title?.trim()) {
      throw new ValidationError("Chapter title is required.");
    }

    const newOrder = story.chapters.length;

    story.chapters.push({
      title: title.trim(),
      bannerImage: bannerImage || null,
      caption: caption || "",
      content: content || { type: "doc", content: [] },
      order: newOrder,
    });

    await story.save();

    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /stories/:storyId/chapters/:chapterId
 * Update a specific chapter
 */
export async function updateChapter(req, res, next) {
  try {
    const { storyId, chapterId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    if (["submitted", "analyzing", "verified", "enriching", "enriched"].includes(story.status)) {
      throw new ValidationError(
        "Cannot edit chapters while story is in review processing.",
      );
    }

    const chapter = story.chapters.id(chapterId);
    if (!chapter) {
      throw new NotFoundError("Chapter not found.");
    }

    const { title, bannerImage, caption, content } = req.body;

    if (title !== undefined) chapter.title = title.trim();
    if (bannerImage !== undefined) chapter.bannerImage = bannerImage;
    if (caption !== undefined) chapter.caption = caption;
    if (content !== undefined) chapter.content = content;

    await story.save();

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /stories/:storyId/chapters/:chapterId
 * Remove a chapter from a story
 */
export async function deleteChapter(req, res, next) {
  try {
    const { storyId, chapterId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    if (["submitted", "analyzing", "verified", "enriching", "enriched"].includes(story.status)) {
      throw new ValidationError(
        "Cannot delete chapters while story is in review processing.",
      );
    }

    if (story.chapters.length <= 1) {
      throw new ValidationError("Cannot delete the last chapter. Stories must have at least one chapter.");
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

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /stories/:storyId/chapters/reorder
 * Reorder chapters
 */
export async function reorderChapters(req, res, next) {
  try {
    const { storyId } = req.params;
    const { chapterIds } = req.body;

    if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
      throw new ValidationError("chapterIds array is required.");
    }

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    if (["submitted", "analyzing", "verified", "enriching", "enriched"].includes(story.status)) {
      throw new ValidationError(
        "Cannot reorder chapters while story is in review processing.",
      );
    }

    // Validate all IDs exist in the story
    const storyChapterIds = story.chapters.map((ch) => ch._id.toString());
    const allExist = chapterIds.every((id) => storyChapterIds.includes(id));
    if (!allExist || chapterIds.length !== storyChapterIds.length) {
      throw new ValidationError("Invalid chapter order — all chapters must be included.");
    }

    // Reorder
    const reordered = chapterIds.map((id, idx) => {
      const ch = story.chapters.id(id);
      ch.order = idx;
      return ch;
    });

    story.chapters = reordered;
    await story.save();

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /stories/:storyId/verify
 * Synchronous pre-flight content moderation check.
 */
export async function verify(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

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

    res.json({
      success: true,
      data: {
        canProceed: story.analysis.canProceed,
        issues: story.analysis.issues,
        analysis: story.analysis,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /stories/:storyId/publish
 * Publish Story (Enqueues Worker Pipeline)
 * Now also allows re-publishing published stories after adding chapters
 */
export async function publish(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    // Allow publishing drafts OR re-publishing published stories
    if (!["draft", "published"].includes(story.status)) {
      throw new ValidationError("Only drafts or published stories can be submitted for publishing.");
    }

    // Field validation checks
    if (!story.title?.trim()) {
      throw new ValidationError("Story title is required before publishing.");
    }

    // Validate chapters exist
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
    await publishMessage({
      jobType: "story_analysis",
      storyId: story.id,
    });

    res.status(200).json({
      success: true,
      message: "Story submitted successfully for moderation and processing.",
      data: {
        id: story.id,
        status: story.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /stories/:storyId
 * Delete Story
 */
export async function remove(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    // Allowed only for draft, rejected, or failed
    if (!["draft", "rejected", "failed"].includes(story.status)) {
      throw new ValidationError(
        "Published or in-review stories cannot be deleted.",
      );
    }

    await story.deleteOne();

    res.json({
      success: true,
      message: "Story deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stories/drafts
 * Get Drafts for Logged-In Author
 */
export async function getDrafts(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const filter = {
      author: req.user.id,
      status: { $ne: "published" },
    };

    const [drafts, total] = await Promise.all([
      Story.find(filter)
        .select("-embeddingMetadata")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Story.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        stories: drafts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stories/:storyId
 * Get Single Story
 */
export async function getStory(req, res, next) {
  try {
    const { storyId } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(storyId);

    const filter = isObjectId ? { _id: storyId } : { slug: storyId };

    const story = await Story.findOne(filter)
      .select("-embeddingMetadata")
      .populate("author", "fullName username avatar profession verification.status")
      .lean();

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    const isOwner =
      req.user && story.author?._id?.toString() === req.user.id.toString();

    // Access check: Owner sees all states, public requester only sees published & public
    if (!isOwner) {
      if (story.status !== "published" || story.visibility !== "public") {
        throw new ForbiddenError(
          "You do not have permission to view this story.",
        );
      }
    }

    let likedByUser = false;
    let followingAuthor = false;

    if (req.user) {
      const existingLike = await Like.findOne({
        story: story._id,
        user: req.user.id,
      });
      likedByUser = !!existingLike;

      if (req.role === "user") {
        const followExists = await Follow.findOne({
          who: req.user.id,
          whom: story.author?._id || story.author,
        });
        followingAuthor = !!followExists;
      }
    }

    res.json({
      success: true,
      data: {
        ...story,
        likedByUser,
        followingAuthor,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stories
 * List Published Feed Stories
 */
export async function list(req, res, next) {
  try {
    const { type, author, profession } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit =
      type === "latest" || type === "trending"
        ? 10
        : Math.min(Number(req.query.limit) || 20, 50);

    const filter = {
      status: "published",
      visibility: "public",
    };

    if (author) {
      filter.author = author;
    }

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
      .populate("author", "fullName username avatar profession verification.status");

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
        query = query.sort({
          publishedAt: -1,
        });
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

    if (req.user && req.role === "user" && stories.length) {
      const storyIds = stories.map((story) => story._id);

      const authorIds = stories
        .map((story) => story.author?._id)
        .filter(Boolean);

      const [follows, likes] = await Promise.all([
        Follow.find({
          who: req.user.id,
          whom: { $in: authorIds },
        })
          .select("whom")
          .lean(),

        Like.find({
          user: req.user.id,
          story: { $in: storyIds },
        })
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

    res.json({
      success: true,
      data: {
        stories: enrichedStories,
        pagination: {
          page: type ? 1 : page,
          limit,
          total,
          pages: type ? 1 : Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /stories/:storyId/like
 * Toggle Like
 */
export async function toggleLike(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      status: "published",
      visibility: "public",
    }).select("_id author");

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    const existing = await Like.findOne({
      story: storyId,
      user: req.user.id,
    });

    if (existing) {
      await Promise.all([
        existing.deleteOne(),
        Story.findByIdAndUpdate(storyId, {
          $inc: { "stats.likes": -1 },
          $pull: { recentLikers: { user: req.user.id } },
        }),
        Author.findByIdAndUpdate(story.author, {
          $inc: { "stats.likes": -1 },
        }),
      ]);

      return res.json({
        success: true,
        data: { liked: false },
      });
    }

    const userDoc = await User.findById(req.user.id).select("fullName").lean();

    await Promise.all([
      Like.create({
        story: storyId,
        user: req.user.id,
      }),
      Story.findByIdAndUpdate(storyId, {
        $inc: { "stats.likes": 1 },
        $push: {
          recentLikers: {
            $each: [
              { user: req.user.id, fullName: userDoc?.fullName || "User" },
            ],
            $position: 0,
            $slice: 3,
          },
        },
      }),
      Author.findByIdAndUpdate(story.author, {
        $inc: { "stats.likes": 1 },
      }),
    ]);

    res.json({
      success: true,
      data: { liked: true },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stories/:storyId/likes
 */
export async function getLikes(req, res, next) {
  try {
    const { storyId } = req.params;

    const likes = await Like.find({ story: storyId })
      .populate("user", "fullName avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: likes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /stories/:storyId/comments
 */
export async function createComment(req, res, next) {
  try {
    const { storyId } = req.params;
    const { content } = req.body;

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
      user: req.user.id,
      content: content.trim(),
    });

    await Story.findByIdAndUpdate(storyId, {
      $inc: { "stats.comments": 1 },
    });

    const populated = await Comment.findById(comment.id)
      .populate("user", "fullName avatar")
      .lean();

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /stories/comments/:commentId
 */
export async function updateComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      throw new ValidationError("Comment cannot be empty.");
    }

    const comment = await Comment.findOne({
      _id: commentId,
      user: req.user.id,
    });

    if (!comment) {
      throw new NotFoundError("Comment not found.");
    }

    comment.content = content.trim();
    comment.edited = true;

    await comment.save();

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /stories/comments/:commentId
 */
export async function deleteComment(req, res, next) {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findOne({
      _id: commentId,
      user: req.user.id,
    });

    if (!comment) {
      throw new NotFoundError("Comment not found.");
    }

    await Promise.all([
      comment.deleteOne(),
      Story.findByIdAndUpdate(comment.story, {
        $inc: { "stats.comments": -1 },
      }),
    ]);

    res.json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stories/:storyId/comments
 */
export async function getComments(req, res, next) {
  try {
    const { storyId } = req.params;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const [comments, total] = await Promise.all([
      Comment.find({ story: storyId })
        .populate("user", "fullName avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Comment.countDocuments({ story: storyId }),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
