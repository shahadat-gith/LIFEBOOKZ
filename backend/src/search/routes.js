import { Router } from "express";

import * as search from "./controllers.js";

const router = Router();

router.get("/", search.semanticSearch);

router.get("/professions", search.getProfessions);

export default router;
