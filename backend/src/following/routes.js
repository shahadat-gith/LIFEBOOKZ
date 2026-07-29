import { Router } from "express";
import { authenticate, authenticateSoft } from "../shared/middlewares/auth.js";
import * as following from "./controller.js";

const router = Router();

// Follow / Unfollow
router.post("/:authorId/follow", authenticate, following.followAuthor);
router.delete("/:authorId/follow", authenticate, following.unfollowAuthor);

// Check follow status
router.get("/:authorId/check", authenticateSoft, following.checkFollow);

// Get followers of an author
router.get("/:authorId/followers", following.getFollowers);

// Get who a user is following
router.get("/user/:userId/following", following.getFollowing);

export default router;
