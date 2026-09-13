import { Router } from "express";

import { optionalAuth } from "../../core/middlewares/auth.js";
import * as search from "./controller.js";

const router = Router();

// Auth required so results can include personalized like/follow state
// Search is public — guests can browse stories too.
router.get("/", optionalAuth, search.semanticSearch);

router.get("/professions", search.getProfessions);

export default router;
