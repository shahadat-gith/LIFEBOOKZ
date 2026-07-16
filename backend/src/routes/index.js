import { Router } from "express";

import userRoutes from "../user/routes.js";
import authorRoutes from "../author/routes.js";
import adminRoutes from "../admin/routes.js";
import storyRoutes from "../story/routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/authors", authorRoutes);
router.use("/admin", adminRoutes);
router.use("/stories", storyRoutes);

export default router;