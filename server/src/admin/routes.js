import { Router } from "express";
import { adminLogin } from "../auth/controllers.js";
import { authenticate } from '../auth/middleware.js';
import {
  dashboard, listApplications, approveApplication, rejectApplication, health,
} from "./controllers.js";

const router = Router();

router.post("/login", adminLogin);
router.use(authenticate);

router.get("/dashboard", dashboard);
router.get("/applications", listApplications);
router.post("/applications/:authorId/approve", approveApplication);
router.post("/applications/:authorId/reject", rejectApplication);
router.get("/health", health);

export default router;
