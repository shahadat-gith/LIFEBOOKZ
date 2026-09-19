import { Router } from "express";
import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as following from "./controller.js";

const router = Router();

// Any signed-in account (reader, author or expert) can follow an author.
const followerOnly = [authenticate, authorize("user", "author", "expert")];

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
