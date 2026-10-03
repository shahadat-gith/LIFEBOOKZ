import { jest } from "@jest/globals";
import crypto from "node:crypto";
import { verifyPaymentSignature } from "../src/utils/consultation.js";

// Config must see these before the modules under test are imported.
process.env.RAZORPAY_KEY_ID = "rzp_test_keyid";
process.env.RAZORPAY_KEY_SECRET = "test_secret_key";
process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
process.env.CONSULT_REQUEST_TTL_HOURS = "48";
process.env.CONSULT_SESSION_STALE_MINUTES = "10";

// ---------------------------------------------------------------------------
// Model / service mocks
// ---------------------------------------------------------------------------

const consultationMock = {
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  updateMany: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  aggregate: jest.fn(),
  find: jest.fn(),
  distinct: jest.fn(),
};

const expertMock = {
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateOne: jest.fn(),
};

await jest.unstable_mockModule("../src/models/Consultation.js", () => ({
  default: consultationMock,
  PAYABLE_STATUSES: ["CONFIRMED"],
}));

await jest.unstable_mockModule("../src/models/Expert.js", () => ({
  default: expertMock,
}));

const signalingCreateMock = jest.fn();
await jest.unstable_mockModule("../src/models/SignalingMessage.js", () => ({
  default: { create: signalingCreateMock },
}));

await jest.unstable_mockModule("../src/services/logger.service.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mailMocks = { request: jest.fn(), status: jest.fn() };
await jest.unstable_mockModule("../src/services/mailer.service.js", () => ({
  sendBookingRequestMail: mailMocks.request,
  sendBookingStatusMail: mailMocks.status,
}));

const paymentMocks = {
  createOrder: jest.fn(),
  verifyCheckout: jest.fn(),
  verifyWebhook: jest.fn(),
  checkoutConfig: jest.fn(() => ({ keyId: "rzp_test_keyid", currency: "INR" })),
  isConfigured: jest.fn(() => true),
};
await jest.unstable_mockModule("../src/services/payment.service.js", () => paymentMocks);

const consultService = await import("../src/services/consult.service.js");
const sessionService = await import("../src/services/session.service.js");
const { default: Consultation } = await import("../src/models/Consultation.js");
const { default: Expert } = await import("../src/models/Expert.js");

const expectAppError = (error, code) => {
  expect(error).toBeTruthy();
  expect(error.isAppError).toBe(true);
  expect(error.code).toBe(code);
};

// Chainable query helper for find(...).select().populate().sort().limit().lean()
function chain(result) {
  const q = {};
  for (const method of ["select", "populate", "sort", "limit", "session", "lean", "distinct"]) {
    q[method] = jest.fn(() => q);
  }
  q.then = (resolve) => Promise.resolve(result).then(resolve);
  q.catch = (reject) => Promise.resolve(result).catch(reject);
  Object.defineProperty(q, Symbol.toStringTag, { value: "Query" });
  return q;
}

beforeEach(() => {
  jest.clearAllMocks();

  // Sensible defaults so sweeps and lists never explode on undefined.
  consultationMock.updateMany.mockResolvedValue({ modifiedCount: 0 });
  consultationMock.updateOne.mockResolvedValue({ modifiedCount: 0 });
  consultationMock.find.mockReturnValue(chain([]));
  consultationMock.distinct.mockResolvedValue([]);
  consultationMock.aggregate.mockResolvedValue([]);
  consultationMock.countDocuments.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

describe("matchExperts", () => {
  test("rejects a too-short problem", async () => {
    await expect(
      consultService.matchExperts({ problem: "short" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("rejects an unknown category", async () => {
    await expect(
      consultService.matchExperts({ problem: "I need guidance with my career.", category: "nope" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("excludes experts who are busy (IN_PROGRESS) and ranks by rating", async () => {
    consultationMock.find.mockReturnValue(chain(["e2"]));
    Expert.find.mockReturnValue(
      chain([
        { _id: "e1", fullName: "Low Rated", rating: 3.2 },
        { _id: "e3", fullName: "Top Rated", rating: 4.9 },
      ]),
    );

    const result = await consultService.matchExperts({
      problem: "I need guidance with my career.",
      category: "career",
    });

    // Busy experts are filtered out of the query via $nin.
    expect(Consultation.find).toHaveBeenCalledWith({ status: { $in: ["IN_PROGRESS"] } });
    const query = Expert.find.mock.calls[0][0];
    expect(query._id).toEqual({ $nin: ["e2"] });
    expect(query.categories).toBe("career");
    expect(query["verification.status"]).toBe("approved");

    expect(result.experts.map((e) => e._id)).toEqual(["e3", "e1"]);
    expect(result.matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

describe("createConsultation", () => {
  const user = { id: "u1", fullName: "Test User", email: "u@test.com" };
  const expertDoc = { _id: "e1", id: "e1", fullName: "Dr Expert", email: "e@test.com", price: 500 };

  test("rejects a too-short problem", async () => {
    await expect(
      consultService.createConsultation({ user, input: { expertId: "e1", problem: "short" } }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("rejects an unknown or unapproved expert", async () => {
    Expert.findOne.mockReturnValue(chain(null));
    await expect(
      consultService.createConsultation({ user, input: { expertId: "e1", problem: "I need guidance with my career." } }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("creates a PENDING request with an expiry and emails the expert the problem + category", async () => {
    Expert.findOne.mockReturnValue(chain(expertDoc));
    consultationMock.create.mockImplementation(async (doc) => ({ ...doc, id: "c1" }));

    const result = await consultService.createConsultation({
      user,
      input: { expertId: "e1", problem: "I need guidance with my career.", category: "career" },
    });

    expect(result.status).toBe("PENDING");
    expect(result.requestExpiresAt).toBeInstanceOf(Date);
    expect(result.user).toBe("u1");
    expect(result.expert).toBe("e1");
    expect(result.amount).toBe(50000); // expert price in paise
    expect(result.currency).toBe("INR");

    // The expert's email carries the problem and category, with a dashboard CTA.
    expect(mailMocks.request).toHaveBeenCalledTimes(1);
    expect(mailMocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "e@test.com",
        expertName: "Dr Expert",
        clientName: "Test User",
        clientEmail: "u@test.com",
        category: "career",
        problem: "I need guidance with my career.",
      }),
    );
    expect(mailMocks.request.mock.calls[0][0]).not.toHaveProperty("roomUrl");
  });
});

// ---------------------------------------------------------------------------
// Acceptance — confirm or reject
// ---------------------------------------------------------------------------

describe("acceptConsultation", () => {
  const expertId = "e1";
  const consultationId = "c1";

  const expertDoc = { _id: expertId, id: expertId, fullName: "Dr Expert", price: 500 };
  const pendingDoc = {
    _id: consultationId, id: consultationId, status: "PENDING",
    amount: 50000, userEmail: "u@test.com", userName: "Test User",
  };

  test("refuses when the expert is already busy (IN_PROGRESS elsewhere)", async () => {
    Expert.findById.mockReturnValue(chain(expertDoc));
    Consultation.findOneAndUpdate.mockResolvedValue({ ...pendingDoc, status: "CONFIRMED" });
    Consultation.countDocuments.mockResolvedValue(1); // another IN_PROGRESS session

    await expect(
      consultService.acceptConsultation({ expertId, consultationId }),
    ).rejects.toMatchObject({ code: "CONFLICT_ERROR" });

    // The flip must be conditioned on status PENDING (atomic guard).
    expect(Consultation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: consultationId, expert: expertId, status: "PENDING" }),
      expect.anything(),
      expect.anything(),
    );
    // The busy check targets IN_PROGRESS only.
    expect(Consultation.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ expert: expertId, status: { $in: ["IN_PROGRESS"] } }),
    );
  });

  test("wins the race only once: a second accept finds the request no longer PENDING", async () => {
    Expert.findById.mockReturnValue(chain(expertDoc));
    Consultation.findOneAndUpdate.mockResolvedValue(null); // lost the atomic flip
    Consultation.findOne.mockReturnValue(
      chain({ ...pendingDoc, status: "CONFIRMED" }),
    );

    await expect(
      consultService.acceptConsultation({ expertId, consultationId }),
    ).rejects.toMatchObject({ code: "CONFLICT_ERROR" });
  });

  test("confirms straight to CONFIRMED and emails the user the room link (pay at door)", async () => {
    Expert.findById.mockReturnValue(chain(expertDoc));
    Consultation.findOneAndUpdate.mockResolvedValue({ ...pendingDoc, status: "CONFIRMED" });
    Consultation.countDocuments.mockResolvedValue(0);

    const result = await consultService.acceptConsultation({ expertId, consultationId });

    expect(result.status).toBe("CONFIRMED");
    // No Razorpay order at acceptance — payment happens at the room door.
    expect(paymentMocks.createOrder).not.toHaveBeenCalled();
    expect(Consultation.updateOne).not.toHaveBeenCalled();

    expect(mailMocks.status).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "u@test.com",
        clientName: "Test User",
        expertName: "Dr Expert",
        status: "confirmed",
        roomUrl: expect.stringContaining("/consult/c1/session"),
        amountLabel: expect.stringContaining("₹"),
      }),
    );
  });

  test("a free expert confirms with payment already settled", async () => {
    Expert.findById.mockReturnValue(chain({ ...expertDoc, price: 0 }));
    Consultation.findOneAndUpdate.mockResolvedValue({ ...pendingDoc, status: "CONFIRMED" });
    Consultation.countDocuments.mockResolvedValue(0);

    await consultService.acceptConsultation({ expertId, consultationId });

    const update = Consultation.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set["payment.paidAt"]).toBeInstanceOf(Date);
    expect(update.$set.status).toBe("CONFIRMED");
  });
});

// ---------------------------------------------------------------------------
// Decline
// ---------------------------------------------------------------------------

describe("declineConsultation", () => {
  test("cancels a pending request and emails the user the rejection", async () => {
    Expert.findById.mockReturnValue(chain({ fullName: "Dr Expert" }));
    Consultation.findOneAndUpdate.mockResolvedValue({
      _id: "c1", id: "c1", status: "CANCELLED",
      userEmail: "u@test.com", userName: "Test User",
      cancelReason: "Not my area.",
    });

    const result = await consultService.declineConsultation({
      expertId: "e1",
      consultationId: "c1",
      reason: "Not my area.",
    });

    expect(result.status).toBe("CANCELLED");
    expect(Consultation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "c1", expert: "e1", status: "PENDING" }),
      expect.objectContaining({
        $set: expect.objectContaining({ status: "CANCELLED", cancelledBy: "expert" }),
      }),
      expect.anything(),
    );
    expect(mailMocks.status).toHaveBeenCalledWith(
      expect.objectContaining({ to: "u@test.com", status: "cancelled", reason: "Not my area." }),
    );
  });

  test("refuses when there is no pending request", async () => {
    Expert.findById.mockReturnValue(chain({ fullName: "Dr Expert" }));
    Consultation.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      consultService.declineConsultation({ expertId: "e1", consultationId: "c1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

// ---------------------------------------------------------------------------
// Payment order + verification (pay at the room door)
// ---------------------------------------------------------------------------

describe("createPaymentOrder", () => {
  const userId = "u1";

  test("refuses consultations that are not confirmed", async () => {
    Consultation.findOne.mockResolvedValue(null);
    await expect(
      consultService.createPaymentOrder({ userId, consultationId: "c1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("refuses an already-paid consultation", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: userId, amount: 50000, status: "CONFIRMED",
      payment: { paid: true, orderId: "order_1" },
    });

    await expect(
      consultService.createPaymentOrder({ userId, consultationId: "c1" }),
    ).rejects.toMatchObject({ code: "CONFLICT_ERROR" });
  });

  test("refuses a free consultation", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: userId, amount: 0, status: "CONFIRMED",
      payment: {},
    });

    await expect(
      consultService.createPaymentOrder({ userId, consultationId: "c1" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("is idempotent while an unpaid order is already live", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: userId, amount: 50000, status: "CONFIRMED",
      payment: { orderId: "order_live", amount: 50000, currency: "INR", status: "created", paid: false },
    });

    const order = await consultService.createPaymentOrder({ userId, consultationId: "c1" });
    expect(order.orderId).toBe("order_live");
    expect(paymentMocks.createOrder).not.toHaveBeenCalled();
  });

  test("creates a Razorpay order in paise for a confirmed, unpaid consultation", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: userId, amount: 50000, currency: "INR", status: "CONFIRMED",
      payment: { paid: false },
    });
    paymentMocks.createOrder.mockResolvedValue({
      orderId: "order_1", amount: 50000, currency: "INR", keyId: "rzp_test_keyid",
    });

    const order = await consultService.createPaymentOrder({ userId, consultationId: "c1" });

    expect(order.orderId).toBe("order_1");
    expect(paymentMocks.createOrder).toHaveBeenCalledWith({
      consultation: expect.objectContaining({ id: "c1", amount: 50000 }),
    });
    // Persisted against the still-unpaid payment record.
    expect(Consultation.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ "payment.paid": { $ne: true } }),
      expect.objectContaining({
        $set: expect.objectContaining({
          "payment.orderId": "order_1",
          "payment.status": "created",
        }),
      }),
    );
  });
});

describe("verifyPayment", () => {
  const userId = "u1";
  const secret = "test_secret_key";

  // Give the mocked payment service the REAL signature behaviour (from the
  // utils module, whose crypto logic is covered exhaustively in the utils suite).
  beforeEach(() => {
    paymentMocks.verifyCheckout.mockImplementation(({ orderId, paymentId, signature }) => {
      const ok = verifyPaymentSignature({
        orderId,
        paymentId,
        signature,
        secret: process.env.RAZORPAY_KEY_SECRET,
      });
      if (!ok) {
        const error = new Error("Payment signature verification failed.");
        error.statusCode = 422;
        error.code = "VALIDATION_ERROR";
        error.isAppError = true;
        throw error;
      }
      return { orderId, paymentId, signature };
    });
  });

  const signatureFor = (orderId, paymentId) =>
    crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

  test("rejects an invalid checkout signature", async () => {
    await expect(
      consultService.verifyPayment({
        userId,
        consultationId: "c1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "badsignature",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("rejects a payment whose order does not belong to the consultation", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: userId, status: "CONFIRMED", amount: 50000,
      payment: { orderId: "order_OTHER", paid: false },
    });

    await expect(
      consultService.verifyPayment({
        userId,
        consultationId: "c1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: signatureFor("order_1", "pay_1"),
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("marks the payment paid and keeps the status CONFIRMED (session starts on join)", async () => {
    const consultation = {
      _id: "c1", id: "c1", user: userId, status: "CONFIRMED", amount: 50000,
      currency: "INR", payment: { orderId: "order_1", paid: false },
    };
    Consultation.findOne.mockResolvedValue(consultation);
    Consultation.findOneAndUpdate.mockResolvedValue({
      ...consultation,
      payment: { orderId: "order_1", paymentId: "pay_1", paid: true },
    });

    const result = await consultService.verifyPayment({
      userId,
      consultationId: "c1",
      orderId: "order_1",
      paymentId: "pay_1",
      signature: signatureFor("order_1", "pay_1"),
    });

    expect(result.payment.paid).toBe(true);
    expect(result.status).toBe("CONFIRMED");
    // Atomic guard: only a confirmed, still-unpaid consultation can be marked paid.
    expect(Consultation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "CONFIRMED",
        "payment.paid": { $ne: true },
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          "payment.paid": true,
          "payment.paymentId": "pay_1",
          "payment.status": "paid",
        }),
      }),
      expect.anything(),
    );
  });

  test("is idempotent for the same payment verified twice", async () => {
    const paid = {
      _id: "c1", id: "c1", user: userId, status: "CONFIRMED",
      payment: { orderId: "order_1", paymentId: "pay_1", paid: true },
    };
    Consultation.findOne.mockResolvedValue(paid);

    const result = await consultService.verifyPayment({
      userId,
      consultationId: "c1",
      orderId: "order_1",
      paymentId: "pay_1",
      signature: signatureFor("order_1", "pay_1"),
    });

    expect(result.payment.paid).toBe(true);
    expect(Consultation.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("refuses to pay a cancelled consultation", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: userId, status: "CANCELLED", amount: 50000,
      payment: { orderId: "order_1", paid: false },
    });

    await expect(
      consultService.verifyPayment({
        userId,
        consultationId: "c1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: signatureFor("order_1", "pay_1"),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT_ERROR" });
  });
});

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

describe("handleWebhook", () => {
  const raw = (obj) => Buffer.from(JSON.stringify(obj));

  test("rejects an invalid webhook signature", async () => {
    paymentMocks.verifyWebhook.mockReturnValue(false);
    await expect(
      consultService.handleWebhook({ rawBody: raw({ event: "payment.captured" }), signature: "nope" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("payment.failed only updates the payment record — the session lifecycle is untouched", async () => {
    paymentMocks.verifyWebhook.mockReturnValue(true);
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", status: "CONFIRMED",
      payment: { orderId: "order_1", paymentId: "", paid: false },
    });

    const result = await consultService.handleWebhook({
      rawBody: raw({
        event: "payment.failed",
        payload: { payment: { entity: { order_id: "order_1", id: "pay_1", error_description: "Card declined" } } },
      }),
      signature: "ok",
    });

    expect(result.action).toBe("markFailed");
    expect(Consultation.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "c1", status: "CONFIRMED" }),
      expect.objectContaining({
        $set: expect.objectContaining({
          "payment.status": "failed",
          "payment.failureReason": "Card declined",
        }),
      }),
    );
    // The consultation status is NOT changed by webhooks.
    const update = Consultation.updateOne.mock.calls[0][1];
    expect(update.$set.status).toBeUndefined();
  });

  test("payment.captured marks the consultation paid (idempotently)", async () => {
    paymentMocks.verifyWebhook.mockReturnValue(true);
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", status: "CONFIRMED", amount: 50000, currency: "INR",
      payment: { orderId: "order_1", paymentId: "", paid: false },
    });

    const result = await consultService.handleWebhook({
      rawBody: raw({
        event: "payment.captured",
        payload: { payment: { entity: { order_id: "order_1", id: "pay_1" } } },
      }),
      signature: "ok",
    });

    expect(result.action).toBe("markPaid");
    expect(Consultation.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ status: "CONFIRMED", "payment.paid": { $ne: true } }),
      expect.objectContaining({
        $set: expect.objectContaining({
          "payment.paid": true,
          "payment.paymentId": "pay_1",
        }),
      }),
    );
  });

  test("a replayed capture webhook is ignored once already paid", async () => {
    paymentMocks.verifyWebhook.mockReturnValue(true);
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", status: "CONFIRMED",
      payment: { orderId: "order_1", paymentId: "pay_1", paid: true },
    });

    const result = await consultService.handleWebhook({
      rawBody: raw({
        event: "payment.captured",
        payload: { payment: { entity: { order_id: "order_1", id: "pay_1" } } },
      }),
      signature: "ok",
    });

    expect(result.handled).toBe(false);
    expect(Consultation.updateOne).not.toHaveBeenCalled();
  });

  test("an unknown order is acknowledged without action", async () => {
    paymentMocks.verifyWebhook.mockReturnValue(true);
    Consultation.findOne.mockResolvedValue(null);

    const result = await consultService.handleWebhook({
      rawBody: raw({
        event: "payment.captured",
        payload: { payment: { entity: { order_id: "order_unknown", id: "pay_1" } } },
      }),
      signature: "ok",
    });

    expect(result.handled).toBe(false);
    expect(Consultation.updateOne).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Authorization + session access (pay at the door)
// ---------------------------------------------------------------------------

describe("session authorization", () => {
  test("a non-participant cannot access the session", async () => {
    Consultation.findOne.mockResolvedValue(null);
    await expect(
      sessionService.getSessionConfig({ consultationId: "c1", userId: "intruder", role: "user" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("only the assigned user or expert role may proceed", async () => {
    await expect(
      sessionService.getSessionConfig({ consultationId: "c1", userId: "u1", role: "author" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("a pending consultation cannot be joined", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: "u1", status: "PENDING", amount: 50000, session: {}, payment: {},
    });

    await expect(
      sessionService.getSessionConfig({ consultationId: "c1", userId: "u1", role: "user" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("a cancelled consultation cannot be joined", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: "u1", status: "CANCELLED", amount: 50000, session: {}, payment: {},
    });

    await expect(
      sessionService.getSessionConfig({ consultationId: "c1", userId: "u1", role: "user" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("a confirmed but unpaid user gets paymentRequired with the ₹ amount, not a rejection", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: "u1", status: "CONFIRMED",
      amount: 50000, currency: "INR", session: {}, payment: { paid: false },
    });

    const data = await sessionService.getSessionConfig({
      consultationId: "c1",
      userId: "u1",
      role: "user",
    });

    expect(data.paymentRequired).toBe(true);
    expect(data.amount).toBe(50000);
    expect(data.currency).toBe("INR");
    expect(data.side).toBe("user");
  });

  test("a paid user (or a free consultation) does not need payment", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: "u1", status: "CONFIRMED", amount: 0, session: {}, payment: {},
    });

    const data = await sessionService.getSessionConfig({
      consultationId: "c1",
      userId: "u1",
      role: "user",
    });

    expect(data.paymentRequired).toBe(false);
  });

  test("the expert never needs payment", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", expert: "e1", status: "CONFIRMED", amount: 50000,
      session: {}, payment: { paid: false },
    });

    const data = await sessionService.getSessionConfig({
      consultationId: "c1",
      userId: "e1",
      role: "expert",
    });

    expect(data.paymentRequired).toBe(false);
    expect(data.iceServers.length).toBeGreaterThan(0);
  });
});

describe("joinSession", () => {
  const base = { _id: "c1", id: "c1", user: "u1", expert: "e1", amount: 50000 };

  test("an unpaid user cannot enter the room", async () => {
    Consultation.findOne.mockResolvedValue({
      ...base, status: "CONFIRMED", payment: { paid: false }, session: {},
    });

    await expect(
      sessionService.joinSession({ consultationId: "c1", userId: "u1", role: "user" }),
    ).rejects.toMatchObject({ code: "CONFLICT_ERROR" });
  });

  test("a paid user's join starts the session: CONFIRMED → IN_PROGRESS", async () => {
    Consultation.findOne.mockResolvedValue({
      ...base, status: "CONFIRMED", payment: { paid: true }, session: {},
    });
    Consultation.findOneAndUpdate.mockResolvedValue({
      ...base, status: "IN_PROGRESS", payment: { paid: true },
      session: { startedAt: new Date() },
    });

    const result = await sessionService.joinSession({ consultationId: "c1", userId: "u1", role: "user" });

    expect(result.status).toBe("IN_PROGRESS");
    expect(Consultation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: { $in: ["CONFIRMED", "IN_PROGRESS"] } }),
      expect.objectContaining({
        $set: expect.objectContaining({ status: "IN_PROGRESS" }),
      }),
      expect.anything(),
    );
  });

  test("the expert joins free and never flips the status", async () => {
    Consultation.findOne.mockResolvedValue({
      ...base, status: "CONFIRMED", payment: { paid: false }, session: {},
    });
    Consultation.findOneAndUpdate.mockResolvedValue({
      ...base, status: "CONFIRMED", payment: { paid: false },
      session: { expertJoinedAt: new Date() },
    });

    const result = await sessionService.joinSession({ consultationId: "c1", userId: "e1", role: "expert" });

    expect(result.status).toBe("CONFIRMED");
    const update = Consultation.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.status).toBeUndefined();
    expect(update.$set["session.expertJoinedAt"]).toBeInstanceOf(Date);
  });
});

describe("heartbeat", () => {
  test("refuses to heartbeat a session that is not IN_PROGRESS", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: "u1", status: "CONFIRMED", session: {}, payment: { paid: true },
    });

    await expect(
      sessionService.heartbeat({ consultationId: "c1", userId: "u1", role: "user" }),
    ).rejects.toMatchObject({ code: "CONFLICT_ERROR" });
  });

  test("records the heartbeat on a live session", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: "u1", status: "IN_PROGRESS",
      session: { startedAt: new Date() }, payment: { paid: true },
    });
    Consultation.findOneAndUpdate.mockResolvedValue({
      _id: "c1", id: "c1", user: "u1", status: "IN_PROGRESS",
      session: { startedAt: new Date(), userHeartbeatAt: new Date() }, payment: { paid: true },
    });

    const result = await sessionService.heartbeat({ consultationId: "c1", userId: "u1", role: "user" });

    expect(result.status).toBe("IN_PROGRESS");
    expect(Consultation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "IN_PROGRESS" }),
      expect.objectContaining({
        $set: expect.objectContaining({ "session.userHeartbeatAt": expect.any(Date) }),
      }),
      expect.anything(),
    );
  });
});

describe("endSession", () => {
  test("completes the session, records duration and bumps the expert's session count", async () => {
    const startedAt = new Date(Date.now() - 10 * 60 * 1000);
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", expert: "e1", user: "u1", status: "IN_PROGRESS",
      userEmail: "u@test.com", userName: "Test User",
      session: { startedAt },
    });
    Consultation.findOneAndUpdate.mockResolvedValue({
      _id: "c1", id: "c1", status: "COMPLETED",
      session: { startedAt, endedAt: new Date(), durationSeconds: 600 },
    });
    Consultation.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Expert.findById.mockReturnValue(chain({ fullName: "Dr Expert" }));
    Expert.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const result = await sessionService.endSession({
      consultationId: "c1",
      userId: "e1",
      role: "expert",
    });

    expect(result.status).toBe("COMPLETED");
    expect(Expert.updateOne).toHaveBeenCalledWith(
      { _id: "e1" },
      { $inc: { sessions: 1 } },
    );
    // A bye signal is left for the peer and the user is invited to review.
    expect(signalingCreateMock).toHaveBeenCalled();
    expect(mailMocks.status).toHaveBeenCalledWith(
      expect.objectContaining({ to: "u@test.com", status: "completed", bookingsUrl: expect.stringContaining("/bookings") }),
    );
  });

  test("a session that never ran does not count towards the expert's tally", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", expert: "e1", user: "u1", status: "CONFIRMED",
      userEmail: "u@test.com", userName: "Test User",
      session: {},
    });
    Consultation.findOneAndUpdate.mockResolvedValue({
      _id: "c1", id: "c1", status: "COMPLETED",
      session: { startedAt: new Date(), endedAt: new Date(), durationSeconds: 0 },
    });
    Expert.findById.mockReturnValue(chain({ fullName: "Dr Expert" }));

    await sessionService.endSession({ consultationId: "c1", userId: "e1", role: "expert" });

    expect(Expert.updateOne).not.toHaveBeenCalled();
  });

  test("is idempotent when the session already completed", async () => {
    Consultation.findOne.mockResolvedValue({
      _id: "c1", id: "c1", user: "u1", status: "COMPLETED",
      session: { startedAt: new Date(), endedAt: new Date(), durationSeconds: 5 },
    });

    const result = await sessionService.endSession({
      consultationId: "c1", userId: "u1", role: "user",
    });
    expect(result.status).toBe("COMPLETED");
  });
});

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

describe("rateConsultation", () => {
  const userId = "u1";

  test("rejects scores outside 1–5", async () => {
    await expect(
      consultService.rateConsultation({ userId, consultationId: "c1", score: 0 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(
      consultService.rateConsultation({ userId, consultationId: "c1", score: 6 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(
      consultService.rateConsultation({ userId, consultationId: "c1", score: 4.5 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("prevents duplicate ratings on the same consultation", async () => {
    Consultation.findOneAndUpdate.mockResolvedValue(null);
    Consultation.findOne.mockReturnValue(
      chain({
        _id: "c1", id: "c1", user: userId, status: "COMPLETED", rating: { score: 4 },
      }),
    );

    await expect(
      consultService.rateConsultation({ userId, consultationId: "c1", score: 5 }),
    ).rejects.toMatchObject({ code: "CONFLICT_ERROR" });
  });

  test("only completed consultations can be rated", async () => {
    Consultation.findOneAndUpdate.mockResolvedValue(null);
    Consultation.findOne.mockReturnValue(
      chain({ _id: "c1", id: "c1", user: userId, status: "CONFIRMED" }),
    );

    await expect(
      consultService.rateConsultation({ userId, consultationId: "c1", score: 5 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("stores the rating once and refreshes the expert aggregate from records", async () => {
    const rated = { _id: "c1", id: "c1", user: userId, status: "COMPLETED", expert: "e1", rating: { score: 5 } };
    Consultation.findOneAndUpdate.mockResolvedValue(rated);
    Consultation.aggregate.mockResolvedValue([{ average: 4.5, count: 2 }]);
    Expert.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const result = await consultService.rateConsultation({
      userId,
      consultationId: "c1",
      score: 5,
      review: "Great session",
    });

    // The update is conditioned on `rating.score` not existing — one rating per consultation.
    expect(Consultation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ user: userId, status: "COMPLETED", "rating.score": { $exists: false } }),
      expect.objectContaining({
        $set: expect.objectContaining({ rating: expect.objectContaining({ score: 5 }) }),
      }),
      expect.anything(),
    );
    expect(Expert.updateOne).toHaveBeenCalledWith(
      { _id: "e1" },
      { $set: { rating: 4.5, ratingCount: 2 } },
    );
    expect(result.rating.score).toBe(5);
  });
});
