import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as testimony from "./controller.js";

const router = Router();

router.get("/", testimony.list);

router.post("/", authenticate, authorize("user", "author"), testimony.create);

router.delete(
  "/:id",
  authenticate,
  authorize("user", "author", "admin"),
  testimony.remove,
);

export default router;
