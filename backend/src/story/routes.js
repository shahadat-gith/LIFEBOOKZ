import { Router } from "express";

import upload from "../shared/middlewares/multer.js";
import { authenticate, authenticateSoft } from "../shared/middlewares/auth.js";
import * as story from "./controllers.js";

const router = Router();

/* ---------- Stories ---------- */

router.post("/", authenticate, story.create);

router.post("/upload-image", authenticate, upload.single("image"), story.uploadImage);

router.get("/", story.list);

router.get("/:storyId", authenticateSoft, story.getStory);

router.patch("/:storyId", authenticate, story.update);

router.delete("/:storyId", authenticate, story.remove);

router.post("/:storyId/verify", authenticate, story.verify);

router.post("/:storyId/publish", authenticate, story.publish);

/* ---------- Views ---------- */

router.post("/:storyId/view", story.incrementView);

/* ---------- Likes ---------- */

router.post("/:storyId/like", authenticate, story.toggleLike);

/* ---------- Comments ---------- */

router.get("/:storyId/comments", story.getComments);

router.post("/:storyId/comments", authenticate, story.createComment);

router.patch("/comments/:commentId", authenticate, story.updateComment);

router.delete("/comments/:commentId", authenticate, story.deleteComment);

export default router;
