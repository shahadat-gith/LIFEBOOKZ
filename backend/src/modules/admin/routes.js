import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as admin from "./controller.js";

const router = Router();

// Every route below the login is admin-only. `authenticate` resolves the
// caller, `authorize("admin")` keeps users, authors and experts out.
const adminOnly = [authenticate, authorize("admin")];

/* ---------- Authentication ---------- */

router.post("/login", admin.login);

/* ---------- Session ---------- */

router.get("/me", adminOnly, admin.getMe);

/* ---------- Dashboard ---------- */

router.get("/dashboard", adminOnly, admin.dashboard);

/* ---------- Authors ---------- */

router.get("/authors/pending", adminOnly, admin.getPendingAuthors);

router.patch("/authors/:authorId/approve", adminOnly, admin.approveAuthor);

router.patch("/authors/:authorId/reject", adminOnly, admin.rejectAuthor);

router.get("/authors/approved", adminOnly, admin.getApprovedAuthors);

/* ---------- Experts ---------- */

router.get("/experts/pending", adminOnly, admin.getPendingExperts);

router.patch("/experts/:expertId/approve", adminOnly, admin.approveExpert);

router.patch("/experts/:expertId/reject", adminOnly, admin.rejectExpert);

router.get("/experts/approved", adminOnly, admin.getApprovedExperts);

/* ---------- Users ---------- */

router.get("/users", adminOnly, admin.getUsers);

/* ---------- Stories ---------- */

router.get("/stories", adminOnly, admin.getStories);

/* ---------- Logout ---------- */

router.post("/logout", admin.logout);

export default router;
