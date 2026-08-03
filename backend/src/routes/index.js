import { Router } from "express";

import userRoutes from "../user/routes.js";
import authorRoutes from "../author/routes.js";
import adminRoutes from "../admin/routes.js";
import storyRoutes from "../story/routes.js";
import followingRoutes from "../following/routes.js";
import searchRoutes from "../search/routes.js";
import testimonyRoutes from "../testimony/routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/authors", authorRoutes);
router.use("/admin", adminRoutes);
router.use("/stories", storyRoutes);
router.use("/following", followingRoutes);
router.use("/search", searchRoutes);
router.use("/testimonials", testimonyRoutes);

export default router;