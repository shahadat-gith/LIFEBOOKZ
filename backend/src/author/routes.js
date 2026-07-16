import { Router } from "express";
import upload from "../shared/middlewares/multer.js";
import { authenticate } from "../shared/middleware/auth.js";
import {
  authorRegister,
  authorLogin,
  getMe,
  updateMe,
  getProfile,
} from "./controllers.js";

const router = Router();

router.post("/register", upload.single("avatar"), authorRegister);
router.post("/login", authorLogin);

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, upload.single("avatar"), updateMe);

router.get("/:authorId", getProfile);

export default router;