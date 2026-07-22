import { Router } from "express";

import { authenticate } from "../shared/middlewares/auth.js";
import * as admin from "./controllers.js";

const router = Router();

/* ---------- Authentication ---------- */

router.post("/login", admin.login);

/* ---------- Dashboard ---------- */

router.get("/dashboard", authenticate, admin.dashboard);

/* ---------- Authors ---------- */

router.get("/authors/pending", authenticate, admin.getPendingAuthors);

router.patch("/authors/:authorId/approve", authenticate, admin.approveAuthor);

router.patch("/authors/:authorId/reject", authenticate, admin.rejectAuthor);

router.get("/authors/approved", authenticate, admin.getApprovedAuthors);

/* ---------- Users ---------- */

router.get("/users", authenticate, admin.getUsers);

/* ---------- Logout ---------- */

router.post("/logout", admin.logout);

/* ---------- Stories ---------- */

router.get("/stories", authenticate, admin.getStories);

export default router;
