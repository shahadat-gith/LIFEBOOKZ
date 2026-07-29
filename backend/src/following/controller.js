import Follow from "./model.js";
import User from "../user/model.js";
import Author from "../author/model.js";
import { NotFoundError, ValidationError } from "../shared/utils/errors.js";

/**
 * Follow an author
 */
export async function followAuthor(req, res, next) {
  try {
    const { authorId } = req.params;

    if (req.role !== "user") {
      throw new ValidationError("Only users can follow authors.");
    }

    const author = await Author.findById(authorId);
    if (!author) {
      throw new NotFoundError("Author not found.");
    }

    // Check if already following
    const existing = await Follow.findOne({
      who: req.user.id,
      whom: authorId,
    });

    if (existing) {
      throw new ValidationError("Already following this author.");
    }

    await Promise.all([
      Follow.create({
        who: req.user.id,
        whom: authorId,
      }),
      User.findByIdAndUpdate(req.user.id, {
        $inc: { "stats.following": 1 },
      }),
      Author.findByIdAndUpdate(authorId, {
        $inc: { "stats.followers": 1 },
      }),
    ]);

    res.status(201).json({
      success: true,
      data: { following: true },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unfollow an author
 */
export async function unfollowAuthor(req, res, next) {
  try {
    const { authorId } = req.params;

    if (req.role !== "user") {
      throw new ValidationError("Only users can unfollow authors.");
    }

    const follow = await Follow.findOneAndDelete({
      who: req.user.id,
      whom: authorId,
    });

    if (!follow) {
      throw new NotFoundError("You are not following this author.");
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user.id, {
        $inc: { "stats.following": -1 },
      }),
      Author.findByIdAndUpdate(authorId, {
        $inc: { "stats.followers": -1 },
      }),
    ]);

    res.json({
      success: true,
      data: { following: false },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Check if current user is following an author
 */
export async function checkFollow(req, res, next) {
  try {
    const { authorId } = req.params;

    let following = false;
    if (req.user) {
      const existing = await Follow.findOne({
        who: req.user.id,
        whom: authorId,
      });
      following = !!existing;
    }

    res.json({
      success: true,
      data: { following },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get followers of an author
 */
export async function getFollowers(req, res, next) {
  try {
    const { authorId } = req.params;

    const followers = await Follow.find({ whom: authorId })
      .populate("who", "fullName avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: followers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get who a user is following
 */
export async function getFollowing(req, res, next) {
  try {
    const { userId } = req.params;

    // Validate userId before querying to avoid CastError
    if (
      !userId ||
      userId === "undefined" ||
      userId === "null" ||
      !/^[0-9a-fA-F]{24}$/.test(userId)
    ) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const following = await Follow.find({ who: userId })
      .populate("whom", "fullName avatar profession")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: following,
    });
  } catch (error) {
    next(error);
  }
}
