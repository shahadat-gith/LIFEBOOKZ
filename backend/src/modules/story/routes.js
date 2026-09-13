import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import {
  authenticate,
  optionalAuth,
  authorize,
  requireApproved,
  requireProfileComplete,
} from "../../core/middlewares/auth.js";
import * as story from "./controller.js";

const router = Router();

// Reading is public — anyone can browse the feed and read published stories.
// A valid token is still honored so responses can include personalized
// like/follow state; guests simply get the public view.
const canRead = [optionalAuth];
// Writing requires an authenticated author account.
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

// Auth optional so guests can read; personalized state attached when signed in
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

// Publishing additionally requires the author's profile to be complete.
router.post(
  "/:storyId/publish",
  authorOnly,
  requireProfileComplete,
  story.publish,
);

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

// Comments are publicly readable
router.get("/:storyId/comments", story.getComments);

router.post("/:storyId/comments", userOnly, story.createComment);

router.patch("/comments/:commentId", userOnly, story.updateComment);

router.delete("/comments/:commentId", userOnly, story.deleteComment);

export default router;
