import { Router } from "express";

import * as search from "./controller.js";

const router = Router();

// Search is public — guests can browse stories too.
router.get("/", search.searchStories);

router.get("/professions", search.getProfessions);

export default router;
