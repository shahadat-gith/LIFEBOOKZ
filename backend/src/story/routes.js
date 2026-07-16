import { Router } from "express";

import { authenticate } from "../shared/middlewares/auth.js";
import * as story from "./controllers.js";

const router = Router();

/* ---------- Stories ---------- */

router.post("/", authenticate, story.create);

router.get("/", story.list);


router.get("/:storyId", story.getStory);

router.patch("/:storyId", authenticate, story.update);

router.delete("/:storyId", authenticate, story.remove);

router.post("/:storyId/submit", authenticate, story.submit);

/* ---------- Likes ---------- */

router.post("/:storyId/like", authenticate, story.toggleLike);

/* ---------- Comments ---------- */

router.get("/:storyId/comments", story.getComments);

router.post("/:storyId/comments", authenticate, story.createComment);

router.patch("/comments/:commentId", authenticate, story.updateComment);

router.delete("/comments/:commentId", authenticate, story.deleteComment);

export default router;