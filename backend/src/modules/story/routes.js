import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import {
  authenticate,
  authorize,
  requireProfileComplete,
} from "../../core/middlewares/auth.js";
import * as story from "./controller.js";
import * as media from "./media.controller.js";

const router = Router();

// Writing requires an authenticated author account. Approval is NOT required —
// authors can write, upload media and manage drafts while pending; only
// publishing is gated further (profile completion).
const authorOnly = [authenticate, authorize("author")];
const userOnly = [authenticate, authorize("user")];

/* ---------- Stories ---------- */

router.post(
  "/",
  authorOnly,
  upload.single("coverImage"),
  story.create,
);

/* ---------- Media (presigned direct-to-R2 uploads) ---------- */

// Issue a presigned PUT URL — the client uploads the file straight to R2.
// Available to every signed-in author, no profile completion needed.
router.post("/media/presign", authorOnly, media.presignMediaUpload);

// Remove an uploaded object from R2
router.delete("/media", authorOnly, media.deleteMedia);

// Reading is public — anyone can browse the feed and read published stories.
router.get("/", story.list);

router.get("/drafts", authorOnly, story.getDrafts);

router.get("/:storyId", story.getStory);
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

// Comment likes — any signed-in account (user, author or expert)
router.post(
  "/comments/:commentId/like",
  authenticate,
  authorize("user", "author", "expert"),
  story.toggleCommentLike,
);

// Replies — the story's author only
router.post(
  "/comments/:commentId/reply",
  authenticate,
  authorize("author"),
  story.replyToComment,
);

router.patch("/comments/:commentId", userOnly, story.updateComment);

router.delete("/comments/:commentId", userOnly, story.deleteComment);

export default router;
