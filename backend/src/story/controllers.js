import Story from "./models/Story.js";
import Like from "./models/Like.js";
import Comment from "./models/Comment.js";
import { publishMessage } from "../shared/sqs/publishers.js";
import { NotFoundError, ValidationError } from "../shared/utils/errors.js";

export async function create(req, res, next) {
  try {
    const { title = "", content = "" } = req.body;

    const story = await Story.create({
      author: req.user.id,
      title,
      content,
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

    if (story.status !== "draft") {
      throw new ValidationError("Only draft stories can be edited.");
    }

    const { title, content, tags } = req.body;

    if (title !== undefined) story.title = title;
    if (content !== undefined) story.content = content;

    await story.save();

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

export async function submit(req, res, next) {
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
      throw new ValidationError("Story has already been submitted.");
    }

    if (!story.title.trim()) {
      throw new ValidationError("Story title is required.");
    }

    if (!story.content.trim()) {
      throw new ValidationError("Story content is required.");
    }

    story.status = "submitted";
    story.verification.status = "pending";
    story.summary.status = "pending";

    await story.save();

    await publishMessage({
      jobType: "story_analysis",
      storyId: story.id,
    });

    res.json({
      success: true,
      message: "Story submitted successfully.",
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

    if (story.status !== "draft") {
      throw new ValidationError("Only draft stories can be deleted.");
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

    res.json({
      success: true,
      data: story,
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

    if (req.query.tag) {
      filter.tags = req.query.tag.toLowerCase();
    }

    const [stories, total] = await Promise.all([
      Story.find(filter)
        .populate("author", "fullName avatar")
        .sort({
          publishedAt: -1,
        })
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
