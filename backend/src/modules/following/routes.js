import { Router } from "express";
import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as following from "./controller.js";

const router = Router();

// Only readers follow authors, so these carry the user role.
const userOnly = [authenticate, authorize("user")];

// Follow / Unfollow
router.post("/:authorId/follow", userOnly, following.followAuthor);
router.delete("/:authorId/follow", userOnly, following.unfollowAuthor);

// Check follow status
router.get("/:authorId/check", userOnly, following.checkFollow);

// Get followers of an author
router.get("/:authorId/followers", following.getFollowers);

// Get who a user is following
router.get("/user/:userId/following", following.getFollowing);

export default router;
