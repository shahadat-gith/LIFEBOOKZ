import { Router } from "express";

import upload from "../shared/middlewares/multer.js";
import { authenticate, authenticateSoft } from "../shared/middlewares/auth.js";

import * as author from "./controllers.js";

const router = Router();

/* ---------- Authentication ---------- */

router.post("/register", upload.single("avatar"), author.register);

router.post("/login", author.login);

/* ---------- Self-service (soft auth — allows pending authors) ---------- */

router.get("/me", authenticateSoft, author.getMe);

router.patch("/me", authenticateSoft, upload.single("avatar"), author.updateMe);

router.get("/me/stories", authenticateSoft, author.getMyStories);

router.get("/me/stories/:storyId", authenticateSoft, author.getMyStory);

/* ---------- Logout ---------- */

router.post("/logout", author.logout);

/* ---------- Public ---------- */

router.get("/:authorId", author.getProfile);

export default router;
