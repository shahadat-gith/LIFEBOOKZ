import * as consultService from "../services/consult.service.js";
import * as sessionService from "../services/session.service.js";
import * as paymentService from "../services/payment.service.js";

/**
 * POST /consult/match
 */
export async function matchExperts(req, res, next) {
  try {
    const { experts, category, matched } = await consultService.matchExperts({
      problem: req.body.problem,
      category: req.body.category,
      limit: req.body.limit,
    });

    return res.json({
      success: true,
      data: { experts, total: experts.length, category, matched },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/requests — user creates a consultation request.
 */
export async function createRequest(req, res, next) {
  try {
    const consultation = await consultService.createConsultation({
      user: req.user,
      input: req.body,
    });

    return res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /consult/mine — the signed-in user's consultations.
 */
export async function listMine(req, res, next) {
  try {
    const consultations = await consultService.listMine({
      userId: req.user?.id,
      role: "user",
      status: req.query.status,
    });

    return res.json({ success: true, data: consultations });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /consult/expert — the signed-in expert's consultations.
 */
export async function listForExpert(req, res, next) {
  try {
    const consultations = await consultService.listMine({
      userId: req.user?.id,
      role: "expert",
      status: req.query.status,
    });

    return res.json({ success: true, data: consultations });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /consult/:consultationId — participant only.
 */
export async function getOne(req, res, next) {
  try {
    const consultation = await consultService.getForParticipant({
      id: req.params.consultationId,
      userId: req.user?.id,
      role: req.role,
    });

    return res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/:consultationId/accept — expert only, concurrency-safe.
 */
export async function accept(req, res, next) {
  try {
    const consultation = await consultService.acceptConsultation({
      expertId: req.user?.id,
      consultationId: req.params.consultationId,
    });

    return res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/:consultationId/decline — expert only.
 */
export async function decline(req, res, next) {
  try {
    const consultation = await consultService.declineConsultation({
      expertId: req.user?.id,
      consultationId: req.params.consultationId,
      reason: req.body.reason,
    });

    return res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/:consultationId/cancel — participant only.
 */
export async function cancel(req, res, next) {
  try {
    const consultation = await consultService.cancelConsultation({
      userId: req.user?.id,
      role: req.role,
      consultationId: req.params.consultationId,
      reason: req.body.reason,
    });

    return res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

/**
 * POST /consult/:consultationId/payment/order
 * Creates (or re-opens) the Razorpay order for the accepted consultation.
 */
export async function createPaymentOrder(req, res, next) {
  try {
    const order = await consultService.createPaymentOrder({
      userId: req.user?.id,
      consultationId: req.params.consultationId,
    });

    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/:consultationId/payment/verify
 * Verifies the Razorpay checkout signature server-side before confirming.
 */
export async function verifyPayment(req, res, next) {
  try {
    const consultation = await consultService.verifyPayment({
      userId: req.user?.id,
      consultationId: req.params.consultationId,
      orderId: req.body.razorpay_order_id,
      paymentId: req.body.razorpay_payment_id,
      signature: req.body.razorpay_signature,
    });

    return res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/webhook — Razorpay server-to-server events.
 * Consumes the RAW body for signature verification (mounted before the JSON
 * parser in app.js). No authentication — the signature is the auth.
 */
export async function webhook(req, res, next) {
  try {
    const result = await consultService.handleWebhook({
      rawBody: req.body, // Buffer, thanks to express.raw on this route
      signature: req.headers["x-razorpay-signature"],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Video session
// ---------------------------------------------------------------------------

/**
 * GET /consult/:consultationId/session — ICE servers + state (participants).
 */
export async function getSession(req, res, next) {
  try {
    const data = await sessionService.getSessionConfig({
      consultationId: req.params.consultationId,
      userId: req.user?.id,
      role: req.role,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/:consultationId/session/join
 */
export async function joinSession(req, res, next) {
  try {
    const data = await sessionService.joinSession({
      consultationId: req.params.consultationId,
      userId: req.user?.id,
      role: req.role,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/:consultationId/session/heartbeat
 */
export async function heartbeat(req, res, next) {
  try {
    const data = await sessionService.heartbeat({
      consultationId: req.params.consultationId,
      userId: req.user?.id,
      role: req.role,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/:consultationId/session/end
 */
export async function endSession(req, res, next) {
  try {
    const data = await sessionService.endSession({
      consultationId: req.params.consultationId,
      userId: req.user?.id,
      role: req.role,
      reason: req.body?.reason,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /consult/:consultationId/session/signal — send to the peer.
 */
export async function postSignal(req, res, next) {
  try {
    const data = await sessionService.postSignal({
      consultationId: req.params.consultationId,
      userId: req.user?.id,
      role: req.role,
      type: req.body?.type,
      payload: req.body?.payload,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /consult/:consultationId/session/messages?after=<id> — poll the peer.
 */
export async function pullSignals(req, res, next) {
  try {
    const data = await sessionService.pullSignals({
      consultationId: req.params.consultationId,
      userId: req.user?.id,
      role: req.role,
      after: req.query.after,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

/**
 * POST /consult/:consultationId/rating — participating user, once only.
 */
export async function rate(req, res, next) {
  try {
    const consultation = await consultService.rateConsultation({
      userId: req.user?.id,
      consultationId: req.params.consultationId,
      score: req.body.score,
      review: req.body.review,
    });

    return res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /consult/checkout-config — public key id for Razorpay Checkout.
 */
export async function checkoutConfig(_req, res, next) {
  try {
    return res.json({
      success: true,
      data: paymentService.checkoutConfig(),
    });
  } catch (error) {
    next(error);
  }
}
