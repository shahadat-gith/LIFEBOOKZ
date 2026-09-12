import { Router } from "express";

import userRoutes from "../modules/user/routes.js";
import authorRoutes from "../modules/author/routes.js";
import adminRoutes from "../modules/admin/routes.js";
import storyRoutes from "../modules/story/routes.js";
import followingRoutes from "../modules/following/routes.js";
import searchRoutes from "../modules/search/routes.js";
import testimonyRoutes from "../modules/testimony/routes.js";
import expertRoutes from "../modules/expert/routes.js";
import consultRoutes from "../modules/consult/routes.js";
import developerRoutes from "../modules/developer/routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/authors", authorRoutes);
router.use("/admin", adminRoutes);
router.use("/stories", storyRoutes);
router.use("/following", followingRoutes);
router.use("/search", searchRoutes);
router.use("/testimonials", testimonyRoutes);
router.use("/experts", expertRoutes);
router.use("/consult", consultRoutes);
router.use("/developer", developerRoutes);

export default router;