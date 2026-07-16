import { Router } from "express";
import { authenticate } from '../shared/middleware/auth.js';
import {
  adminLogin, dashboard, listApplications, approveApplication, rejectApplication,
} from "./controllers.js";

const router = Router();

router.post("/login", adminLogin);
router.use(authenticate);

router.get("/dashboard", dashboard);
router.get("/applications", listApplications);
router.post("/applications/:authorId/approve", approveApplication);
router.post("/applications/:authorId/reject", rejectApplication);

export default router;
