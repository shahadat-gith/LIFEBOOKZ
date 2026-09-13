import { Router } from "express";
import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as following from "./controller.js";

const router = Router();

// Readers and authors both follow authors, so allow both roles.
const followerOnly = [authenticate, authorize("user", "author")];

// Follow / Unfollow
router.post("/:authorId/follow", followerOnly, following.followAuthor);
router.delete("/:authorId/follow", followerOnly, following.unfollowAuthor);

// Check follow status
router.get("/:authorId/check", followerOnly, following.checkFollow);

// Get followers of an author
router.get("/:authorId/followers", following.getFollowers);

// Get who a user is following
router.get("/user/:userId/following", following.getFollowing);

export default router;
