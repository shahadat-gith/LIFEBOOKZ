import { Router } from "express";
import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as following from "./controller.js";

const router = Router();

// Any signed-in account (reader, author or expert) can follow an author.
const followerOnly = [authenticate, authorize("user", "author", "expert")];

router.post("/:authorId/follow", followerOnly, following.followAuthor);
router.delete("/:authorId/follow", followerOnly, following.unfollowAuthor);

router.get("/:authorId/check", followerOnly, following.checkFollow);
router.get("/:authorId/followers", following.getFollowers);
router.get("/user/:userId/following", following.getFollowing);

export default router;
