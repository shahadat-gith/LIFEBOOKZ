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
 * POST /stories
 * Create Draft
 */
export async function create(req, res, next) {
  try {
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

    const story = await Story.create({
      author: req.user.id,
      authorProfession: authorDoc?.profession
        ? authorDoc.profession.toLowerCase()
        : null,
      title: cleanTitle,
      storyType,
      visibility,
      language,
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
 * Update Draft
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

    // Editable only when status == draft, rejected, or failed
    if (!["draft", "rejected", "failed"].includes(story.status)) {
      throw new ValidationError(
        "Cannot edit story while it is processing or published.",
      );
    }

    let { title, storyType, visibility, language } = req.body;
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
 * POST /stories/:storyId/verify
 * Synchronous pre-flight content moderation check.
 * Runs the same LLM analysis as the background pipeline and stores the
 * result in `story.analysis` WITHOUT changing the story status — the
 * async pipeline remains the single source of truth for status changes.
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

    const plainText = extractTextFromDocument(story.content);

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

    if (story.status !== "draft") {
      throw new ValidationError("Only drafts can be submitted for publishing.");
    }

    // Field validation checks
    if (!story.title?.trim()) {
      throw new ValidationError("Story title is required before publishing.");
    }

    const hasContent =
      story.content &&
      (typeof story.content === "string"
        ? story.content.trim().length > 0
        : Array.isArray(story.content?.content)
          ? story.content.content.length > 0
          : Object.keys(story.content).length > 0);

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
      .populate("author", "fullName username avatar profession")
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
        content
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
      .populate("author", "fullName username avatar profession");

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
