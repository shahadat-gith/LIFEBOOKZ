import { Router } from "express";

import { authenticate, authorize } from "../middleware/auth.js";
import * as consult from "../controllers/consult.controller.js";

const router = Router();

// ---------------------------------------------------------------------------
// Webhook — signature IS the authentication. Raw body only (see app.js):
// must be registered before any JSON-parsed route would consume the stream.
// ---------------------------------------------------------------------------
router.post("/webhook", consult.webhook);

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------
router.post(
  "/match",
  authenticate,
  authorize("user"),
  consult.matchExperts,
);

// Public key id for Razorpay Checkout (no secret material).
router.get("/checkout-config", authenticate, authorize("user"), consult.checkoutConfig);

// ---------------------------------------------------------------------------
// User endpoints — `authorize("user")` keeps authors/experts/admins out.
// ---------------------------------------------------------------------------
router.post(
  "/requests",
  authenticate,
  authorize("user"),
  consult.createRequest,
);

router.get("/mine", authenticate, authorize("user"), consult.listMine);

// ---------------------------------------------------------------------------
// Expert endpoints
// ---------------------------------------------------------------------------
router.get("/expert", authenticate, authorize("expert"), consult.listForExpert);

router.post(
  "/:consultationId/accept",
  authenticate,
  authorize("expert"),
  consult.accept,
);

router.post(
  "/:consultationId/decline",
  authenticate,
  authorize("expert"),
  consult.decline,
);

// ---------------------------------------------------------------------------
// Shared participant endpoints (user OR expert — role checked in service)
// ---------------------------------------------------------------------------
router.get(
  "/:consultationId",
  authenticate,
  authorize("user", "expert"),
  consult.getOne,
);

router.post(
  "/:consultationId/cancel",
  authenticate,
  authorize("user", "expert"),
  consult.cancel,
);

// Payment (user side)
router.post(
  "/:consultationId/payment/order",
  authenticate,
  authorize("user"),
  consult.createPaymentOrder,
);

router.post(
  "/:consultationId/payment/verify",
  authenticate,
  authorize("user"),
  consult.verifyPayment,
);

// Video session (both sides)
router.get(
  "/:consultationId/session",
  authenticate,
  authorize("user", "expert"),
  consult.getSession,
);

router.post(
  "/:consultationId/session/join",
  authenticate,
  authorize("user", "expert"),
  consult.joinSession,
);

router.post(
  "/:consultationId/session/heartbeat",
  authenticate,
  authorize("user", "expert"),
  consult.heartbeat,
);

router.post(
  "/:consultationId/session/end",
  authenticate,
  authorize("user", "expert"),
  consult.endSession,
);

router.post(
  "/:consultationId/session/signal",
  authenticate,
  authorize("user", "expert"),
  consult.postSignal,
);

router.get(
  "/:consultationId/session/messages",
  authenticate,
  authorize("user", "expert"),
  consult.pullSignals,
);

// Rating (user side)
router.post(
  "/:consultationId/rating",
  authenticate,
  authorize("user"),
  consult.rate,
);

export default router;
