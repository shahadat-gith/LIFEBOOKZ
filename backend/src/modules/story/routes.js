import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import {
  authenticate,
  authorize,
  requireApproved,
} from "../../core/middlewares/auth.js";
import * as story from "./controller.js";

const router = Router();

// Reading the feed is open to the community roles; only approved authors may
// create or change content; likes and comments belong to readers.
const canRead = [authenticate, authorize("user", "author")];
const authorOnly = [authenticate, authorize("author"), requireApproved];
const userOnly = [authenticate, authorize("user")];

/* ---------- Stories ---------- */

router.post(
  "/",
  authorOnly,
  upload.single("coverImage"),
  story.create,
);

router.post(
  "/upload-image",
  authorOnly,
  upload.single("image"),
  story.uploadImage,
);

// Auth required so responses can include personalized like/follow state
router.get("/", canRead, story.list);

router.get("/:storyId", canRead, story.getStory);

router.patch(
  "/:storyId",
  authorOnly,
  upload.single("coverImage"),
  story.update,
);

router.delete("/:storyId", authorOnly, story.remove);

router.post("/:storyId/verify", authorOnly, story.verify);

router.post("/:storyId/publish", authorOnly, story.publish);

/* ---------- Chapters ---------- */

router.post("/:storyId/chapters", authorOnly, story.addChapter);

router.patch("/:storyId/chapters/reorder", authorOnly, story.reorderChapters);

router.patch("/:storyId/chapters/:chapterId", authorOnly, story.updateChapter);

router.delete("/:storyId/chapters/:chapterId", authorOnly, story.deleteChapter);

/* ---------- Likes ---------- */

router.post("/:storyId/like", userOnly, story.toggleLike);

/* ---------- Comments ---------- */

router.get("/:storyId/comments", story.getComments);

router.post("/:storyId/comments", userOnly, story.createComment);

router.patch("/comments/:commentId", userOnly, story.updateComment);

router.delete("/comments/:commentId", userOnly, story.deleteComment);

export default router;
