import Story from "./models/Story.js";
import Like from "./models/Like.js";
import Comment from "./models/Comment.js";
import { generateContent } from "../shared/services/llm.js";
import {
  getStoryAnalysisPrompt,
  getGrammarCorrectionPrompt,
  getSummaryPrompt,
} from "../shared/prompts/story.js";
import { uploadStoryImage } from "../shared/services/upload.js";
import { NotFoundError, ValidationError } from "../shared/utils/errors.js";

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

export async function create(req, res, next) {
  try {
    const { content = "", title = "" } = req.body;

    const story = await Story.create({
      author: req.user.id,
      content,
      title: title.trim(),
    });

    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

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

    if (!["draft", "rejected"].includes(story.status)) {
      throw new ValidationError("Only draft or rejected stories can be edited.");
    }

    const { content, title } = req.body;

    if (content !== undefined) {
      story.content = content;
    }

    if (title !== undefined) {
      story.title = title.trim();
    }

    // If story was rejected and author saves as draft, reset to draft
    if (story.status === "rejected") {
      story.status = "draft";
      story.verification.issues = [];
      story.verification.canProceed = true;
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

    if (!story.content?.trim()) {
      throw new ValidationError("Story content is required for verification.");
    }

    // Run AI content moderation analysis synchronously
    const result = JSON.parse(
      await generateContent({
        system: getStoryAnalysisPrompt(),
        prompt: story.content,
        json: true,
      }),
    );

    // Store verification result on the story
    story.verification.status = "completed";
    story.verification.canProceed = result.canProceed;
    story.verification.issues = result.issues ?? [];

    if (result.canProceed) {
      story.status = "verified";
    } else {
      story.status = "rejected";
    }

    await story.save();

    res.json({
      success: true,
      data: {
        canProceed: result.canProceed,
        issues: result.issues ?? [],
        overallAssessment: result.overallAssessment ?? "",
      },
    });
  } catch (error) {
    next(error);
  }
}

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

    if (story.status !== "verified") {
      throw new ValidationError(
        "Story must pass AI verification before publishing.",
      );
    }

    if (!story.content?.trim()) {
      throw new ValidationError("Story content is required.");
    }

    // 1. Grammar correction
    const corrected = await generateContent({
      system: getGrammarCorrectionPrompt(),
      prompt: story.content,
    });

    // 2. Summary generation
    const summary = await generateContent({
      system: getSummaryPrompt(),
      prompt: corrected,
    });

    // Save everything
    story.content = corrected.trim();
    story.summary.status = "completed";
    story.summary.content = summary.trim();
    story.status = "published";
    story.publishedAt = new Date();

    await story.save();

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

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

    if (!["draft", "rejected"].includes(story.status)) {
      throw new ValidationError("Only draft or rejected stories can be deleted.");
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

export async function getStory(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      status: "published",
    })
      .populate("author", "fullName avatar bio website socialLinks")
      .lean();

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    // Check if the requesting user has liked this story
    let likedByUser = false;
    if (req.user) {
      const existing = await Like.findOne({
        story: storyId,
        user: req.user.id,
      });
      likedByUser = !!existing;
    }

    res.json({
      success: true,
      data: {
        ...story,
        likedByUser,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const filter = {
      status: "published",
    };

    // Text search support
    if (req.query.q?.trim()) {
      filter.$text = { $search: req.query.q.trim() };
    }

    // Tag filter support
    if (req.query.tag?.trim()) {
      filter.tags = { $in: [req.query.tag.trim().toLowerCase()] };
    }

    const sortOptions =
      req.query.sort === "popular"
        ? { "stats.likes": -1, "stats.views": -1, publishedAt: -1 }
        : req.query.sort === "oldest"
          ? { publishedAt: 1 }
          : req.query.q?.trim()
            ? { score: { $meta: "textScore" }, publishedAt: -1 }
            : { publishedAt: -1 };

    let query = Story.find(filter);

    if (req.query.q?.trim()) {
      query = query.select({ score: { $meta: "textScore" } });
    }

    const [stories, total] = await Promise.all([
      query
        .populate("author", "fullName avatar")
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Story.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        stories,
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

export async function incrementView(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findByIdAndUpdate(storyId, {
      $inc: { "stats.views": 1 },
    }).select("_id");

    if (!story) {
      throw new NotFoundError("Story not found.");
    }

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      status: "published",
    }).select("_id");

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
          $inc: {
            "stats.likes": -1,
          },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          liked: false,
        },
      });
    }

    await Promise.all([
      Like.create({
        story: storyId,
        user: req.user.id,
      }),
      Story.findByIdAndUpdate(storyId, {
        $inc: {
          "stats.likes": 1,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        liked: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getLikes(req, res, next) {
  try {
    const { storyId } = req.params;

    const likes = await Like.find({
      story: storyId,
    })
      .populate("user", "fullName avatar")
      .sort({
        createdAt: -1,
      })
      .lean();

    res.json({
      success: true,
      data: likes,
    });
  } catch (error) {
    next(error);
  }
}

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
      $inc: {
        "stats.comments": 1,
      },
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
        $inc: {
          "stats.comments": -1,
        },
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

export async function getComments(req, res, next) {
  try {
    const { storyId } = req.params;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const [comments, total] = await Promise.all([
      Comment.find({
        story: storyId,
      })
        .populate("user", "fullName avatar")
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Comment.countDocuments({
        story: storyId,
      }),
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
