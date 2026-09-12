import * as followingService from "./service.js";

/**
 * POST /following/:authorId
 * Follow an author.
 */
export async function followAuthor(req, res, next) {
  try {
    await followingService.followAuthor({
      userId: req.user.id,
      role: req.role,
      authorId: req.params.authorId,
    });

    res.status(201).json({
      success: true,
      data: { following: true },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /following/:authorId
 * Unfollow an author.
 */
export async function unfollowAuthor(req, res, next) {
  try {
    await followingService.unfollowAuthor({
      userId: req.user.id,
      role: req.role,
      authorId: req.params.authorId,
    });

    res.json({
      success: true,
      data: { following: false },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /following/:authorId/check
 * Check if the current user follows an author.
 */
export async function checkFollow(req, res, next) {
  try {
    const following = await followingService.isFollowing({
      userId: req.user?.id,
      authorId: req.params.authorId,
    });

    res.json({
      success: true,
      data: { following },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /following/:authorId/followers
 * Followers of an author.
 */
export async function getFollowers(req, res, next) {
  try {
    const followers = await followingService.getFollowers({
      authorId: req.params.authorId,
    });

    res.json({
      success: true,
      data: followers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /following/:userId/following
 * Who a user is following.
 */
export async function getFollowing(req, res, next) {
  try {
    const following = await followingService.getFollowing({
      userId: req.params.userId,
    });

    res.json({
      success: true,
      data: following,
    });
  } catch (error) {
    next(error);
  }
}
