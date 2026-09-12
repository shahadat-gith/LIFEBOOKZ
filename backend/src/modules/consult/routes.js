import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as consult from "./controller.js";

const router = Router();

// Matching and booking are reserved for signed-in users. `authorize("user")`
// keeps author/expert/developer tokens out of the consult flow.
router.post("/match", authenticate, authorize("user"), consult.matchExperts);

router.post(
  "/bookings",
  authenticate,
  authorize("user"),
  consult.createBooking,
);

router.get(
  "/bookings",
  authenticate,
  authorize("user"),
  consult.getMyBookings,
);

router.patch(
  "/bookings/:bookingId/cancel",
  authenticate,
  authorize("user"),
  consult.cancelMyBooking,
);

export default router;
