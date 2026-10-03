import { Router } from "express";

import userRoutes from "./user.routes.js";
import authorRoutes from "./author.routes.js";
import adminRoutes from "./admin.routes.js";
import storyRoutes from "./story.routes.js";
import testimonialRoutes from "./testimonial.routes.js";
import expertRoutes from "./expert.routes.js";
import consultRoutes from "./consult.routes.js";
import developerRoutes from "./developer.routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/authors", authorRoutes);
router.use("/admin", adminRoutes);
router.use("/stories", storyRoutes);
router.use("/testimonials", testimonialRoutes);
router.use("/experts", expertRoutes);
router.use("/consult", consultRoutes);
router.use("/developer", developerRoutes);

export default router;