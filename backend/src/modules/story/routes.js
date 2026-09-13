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

// Media upload (photos / videos / audio) for chapters and stories
router.post(
  "/upload-media",
  authorOnly,
  upload.single("media"),
  story.uploadMedia,
);

// Auth required so responses can include personalized like/follow state
router.get("/", canRead, story.list);

router.get("/drafts", authorOnly, story.getDrafts);

router.get("/:storyId", canRead, story.getStory);

router.patch(
  "/:storyId",
  authorOnly,
  upload.single("coverImage"),
  story.update,
);

// Full author control — delete any time, even after publish
router.delete("/:storyId", authorOnly, story.remove);

/* ---------- Publishing (synchronous, no review pipeline) ---------- */

router.post("/:storyId/publish", authorOnly, story.publish);

router.post("/:storyId/unpublish", authorOnly, story.unpublish);

/* ---------- Chapters ---------- */

router.post("/:storyId/chapters", authorOnly, story.addChapter);

router.patch("/:storyId/chapters/reorder", authorOnly, story.reorderChapters);

router.patch("/:storyId/chapters/:chapterId", authorOnly, story.updateChapter);

router.delete("/:storyId/chapters/:chapterId", authorOnly, story.deleteChapter);

/* ---------- Stories inside chapters ---------- */

router.post(
  "/:storyId/chapters/:chapterId/stories",
  authorOnly,
  story.addChapterStory,
);

router.patch(
  "/:storyId/chapters/:chapterId/stories/:storyEntryId",
  authorOnly,
  story.updateChapterStory,
);

router.delete(
  "/:storyId/chapters/:chapterId/stories/:storyEntryId",
  authorOnly,
  story.deleteChapterStory,
);

/* ---------- Likes ---------- */

router.post("/:storyId/like", userOnly, story.toggleLike);

/* ---------- Comments ---------- */

router.get("/:storyId/comments", story.getComments);

router.post("/:storyId/comments", userOnly, story.createComment);

router.patch("/comments/:commentId", userOnly, story.updateComment);

router.delete("/comments/:commentId", userOnly, story.deleteComment);

export default router;
