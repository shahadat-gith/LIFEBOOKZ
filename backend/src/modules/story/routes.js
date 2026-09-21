import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import {
  authenticate,
  authorize,
  optionalAuthenticate,
  requireProfileComplete,
} from "../../core/middlewares/auth.js";
import * as story from "./controller.js";
import * as media from "./media.controller.js";

const router = Router();

// Writing requires an authenticated author account. Approval is NOT required —
// authors can write, upload media and manage drafts while pending; only
// publishing is gated further (profile completion).
const authorOnly = [authenticate, authorize("author")];
// Any signed-in account can read along: liking, commenting and sharing a
// story are reader actions, and authors read each other's lifebooks too.
const anyAccount = [authenticate, authorize("user", "author", "expert")];

/* ---------- Stories ---------- */

router.post(
  "/",
  authorOnly,
  upload.single("bannerImage"),
  story.create,
);

/* ---------- Media (presigned direct-to-R2 uploads) ---------- */

// Issue a presigned PUT URL — the client uploads the file straight to R2.
// Available to every signed-in author, no profile completion needed.
router.post("/media/presign", authorOnly, media.presignMediaUpload);

// Remove an uploaded object from R2
router.delete("/media", authorOnly, media.deleteMedia);

// Reading is public — anyone can browse the feed and read published stories.
// Optional auth personalises them for a signed-in caller (liked, following)
// without ever blocking an anonymous one.
router.get("/", optionalAuthenticate, story.list);

router.get("/drafts", authorOnly, story.getDrafts);

router.get("/:storyId", optionalAuthenticate, story.getStory);
router.patch(
  "/:storyId",
  authorOnly,
  upload.single("bannerImage"),
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

// Rename a chapter — the title is the author's own
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

router.post("/:storyId/like", anyAccount, story.toggleLike);

/* ---------- Comments ---------- */

// Comments are publicly readable (optionally personalised for signed-in
// callers: likedByMe, own comments)
router.get("/:storyId/comments", optionalAuthenticate, story.getComments);

router.post("/:storyId/comments", anyAccount, story.createComment);

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

router.patch("/comments/:commentId", anyAccount, story.updateComment);

router.delete("/comments/:commentId", anyAccount, story.deleteComment);

export default router;
