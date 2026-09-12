import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as search from "./controller.js";

const router = Router();

// Auth required so results can include personalized like/follow state
router.get("/", authenticate, authorize("user", "author"), search.semanticSearch);

router.get("/professions", search.getProfessions);

export default router;
