import { Router } from "express";

import { authenticate } from "../shared/middlewares/auth.js";
import * as testimony from "./controller.js";

const router = Router();

router.get("/", testimony.list);

router.post("/", authenticate, testimony.create);

router.delete("/:id", authenticate, testimony.remove);

export default router;
