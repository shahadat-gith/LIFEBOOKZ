import { Router } from "express";

import { authenticateOptional } from "../shared/middlewares/auth.js";
import * as search from "./controllers.js";

const router = Router();

// Optional auth so logged-in users get personalized like/follow state
router.get("/", authenticateOptional, search.semanticSearch);

router.get("/professions", search.getProfessions);

export default router;
