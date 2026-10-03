import { describe, expect, test } from "@jest/globals";
import crypto from "node:crypto";

import {
  ALLOWED_TRANSITIONS,
  BUSY_STATUSES,
  CONSULTATION_STATUSES,
  PAYABLE_STATUSES,
  buildExpertOccupiedFilter,
  buildIceServers,
  canTransition,
  decideWebhookAction,
  isSessionStale,
  lastActivityAt,
  sessionDurationSeconds,
  transitionFilter,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../src/utils/consultation.js";

describe("consultation state machine", () => {
  test("exposes the simplified 4-state lifecycle plus terminal states", () => {
    expect(CONSULTATION_STATUSES).toEqual([
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "EXPIRED",
    ]);
    expect(PAYABLE_STATUSES).toEqual(["CONFIRMED"]);
    expect(BUSY_STATUSES).toEqual(["IN_PROGRESS"]);
  });

  test("allows the documented happy path", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  test("allows cancelling from every live state", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransition("IN_PROGRESS", "CANCELLED")).toBe(true);
  });

  test("rejects skipping the confirmation step and resurrecting terminal states", () => {
    expect(canTransition("PENDING", "IN_PROGRESS")).toBe(false);
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
    expect(canTransition("COMPLETED", "IN_PROGRESS")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransition("EXPIRED", "PENDING")).toBe(false);
  });

  test("terminal states have no outgoing transitions", () => {
    expect(ALLOWED_TRANSITIONS.COMPLETED).toEqual([]);
    expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
    expect(ALLOWED_TRANSITIONS.EXPIRED).toEqual([]);
  });

  test("transitionFilter never matches an illegal transition", () => {
    expect(transitionFilter("PENDING", "CONFIRMED")).toEqual({ status: "PENDING" });
    const illegal = transitionFilter("COMPLETED", "IN_PROGRESS");
    expect(illegal).toEqual({ _id: { $exists: false } });
  });
});

describe("expert occupancy filter", () => {
  test("an expert is busy only while a session is IN_PROGRESS", () => {
    const filter = buildExpertOccupiedFilter("expert-1");
    expect(filter.expert).toBe("expert-1");
    expect(filter.status.$in).toEqual(["IN_PROGRESS"]);
  });

  test("can exclude one consultation (the one being accepted)", () => {
    const filter = buildExpertOccupiedFilter("expert-1", "consult-1");
    expect(filter._id).toEqual({ $ne: "consult-1" });
    expect(filter.status.$in).toEqual(["IN_PROGRESS"]);
  });
});

describe("Razorpay signatures", () => {
  const secret = "test_secret_key";

  test("verifies a correctly signed checkout payload", () => {
    const orderId = "order_ABC123";
    const paymentId = "pay_XYZ987";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret })).toBe(true);
  });

  test("rejects tampered order/payment ids, wrong secrets and missing fields", () => {
    const orderId = "order_ABC123";
    const paymentId = "pay_XYZ987";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyPaymentSignature({ orderId: "order_OTHER", paymentId, signature, secret }),
    ).toBe(false);
    expect(
      verifyPaymentSignature({ orderId, paymentId: "pay_OTHER", signature, secret }),
    ).toBe(false);
    expect(
      verifyPaymentSignature({ orderId, paymentId, signature, secret: "wrong_secret" }),
    ).toBe(false);
    expect(verifyPaymentSignature({ orderId, paymentId, signature: "", secret })).toBe(false);
    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret: "" })).toBe(false);
  });

  test("verifies the raw webhook body and rejects a modified body", () => {
    const raw = Buffer.from(JSON.stringify({ event: "payment.captured" }));
    const signature = crypto.createHmac("sha256", secret).update(raw).digest("hex");

    expect(verifyWebhookSignature(raw, signature, secret)).toBe(true);

    const tampered = Buffer.from(JSON.stringify({ event: "payment.captured", extra: true }));
    expect(verifyWebhookSignature(tampered, signature, secret)).toBe(false);
    expect(verifyWebhookSignature(raw, "deadbeef", secret)).toBe(false);
  });
});

describe("webhook decisions (duplicate + failure safety)", () => {
  const payable = {
    status: "CONFIRMED",
    payment: { orderId: "order_1", paymentId: "", paid: false },
  };

  test("marks a confirmed consultation paid on payment.captured", () => {
    expect(
      decideWebhookAction({
        event: "payment.captured",
        consultation: payable,
        payment: { order_id: "order_1", id: "pay_1" },
      }),
    ).toEqual({ action: "markPaid", paymentId: "pay_1" });
  });

  test("also accepts order.paid as a capture event", () => {
    expect(
      decideWebhookAction({
        event: "order.paid",
        consultation: payable,
        payment: { order_id: "order_1", id: "pay_1" },
      }),
    ).toEqual({ action: "markPaid", paymentId: "pay_1" });
  });

  test("ignores a replayed capture once the payment is already marked paid", () => {
    expect(
      decideWebhookAction({
        event: "payment.captured",
        consultation: {
          status: "CONFIRMED",
          payment: { orderId: "order_1", paymentId: "pay_1", paid: true },
        },
        payment: { order_id: "order_1", id: "pay_1" },
      }),
    ).toEqual({ action: "ignore" });
  });

  test("ignores a second, different payment for the same order", () => {
    expect(
      decideWebhookAction({
        event: "payment.captured",
        consultation: {
          status: "CONFIRMED",
          payment: { orderId: "order_1", paymentId: "pay_first", paid: false },
        },
        payment: { order_id: "order_1", id: "pay_second" },
      }),
    ).toEqual({ action: "ignore" });
  });

  test("ignores events for a different order than the consultation owns", () => {
    expect(
      decideWebhookAction({
        event: "payment.captured",
        consultation: payable,
        payment: { order_id: "order_OTHER", id: "pay_1" },
      }),
    ).toEqual({ action: "ignore" });
  });

  test("ignores captures for consultations no longer awaiting payment", () => {
    for (const status of ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "EXPIRED"]) {
      expect(
        decideWebhookAction({
          event: "payment.captured",
          consultation: { status, payment: { orderId: "order_1" } },
          payment: { order_id: "order_1", id: "pay_1" },
        }),
      ).toEqual({ action: "ignore" });
    }
  });

  test("records the failure reason on payment.failed without touching the status", () => {
    const decision = decideWebhookAction({
      event: "payment.failed",
      consultation: payable,
      payment: { order_id: "order_1", id: "pay_1", error_description: "Card declined" },
    });
    expect(decision.action).toBe("markFailed");
    expect(decision.reason).toBe("Card declined");
  });

  test("ignores unknown events and payloads without an order", () => {
    expect(
      decideWebhookAction({ event: "refund.created", consultation: payable, payment: { order_id: "order_1" } }),
    ).toEqual({ action: "ignore" });
    expect(
      decideWebhookAction({ event: "payment.captured", consultation: payable, payment: {} }),
    ).toEqual({ action: "ignore" });
  });
});

describe("session lifecycle helpers", () => {
  test("computes duration in seconds and clamps bad input", () => {
    expect(
      sessionDurationSeconds("2026-10-03T10:00:00.000Z", "2026-10-03T10:42:30.000Z"),
    ).toBe(2550);
    expect(sessionDurationSeconds(null, new Date())).toBe(0);
    expect(
      sessionDurationSeconds("2026-10-03T11:00:00.000Z", "2026-10-03T10:00:00.000Z"),
    ).toBe(0);
  });

  test("a session is stale only when BOTH participants go quiet", () => {
    const staleMs = 10 * 60 * 1000;
    const now = Date.parse("2026-10-03T12:00:00.000Z");
    const started = "2026-10-03T11:00:00.000Z";

    // Both heartbeats long past.
    expect(
      isSessionStale(
        { startedAt: started, userHeartbeatAt: "2026-10-03T11:40:00.000Z", expertHeartbeatAt: "2026-10-03T11:40:00.000Z" },
        staleMs,
        now,
      ),
    ).toBe(true);

    // One participant still alive keeps the session open.
    expect(
      isSessionStale(
        { startedAt: started, userHeartbeatAt: "2026-10-03T11:59:00.000Z", expertHeartbeatAt: "2026-10-03T11:40:00.000Z" },
        staleMs,
        now,
      ),
    ).toBe(false);

    // A freshly started session is never stale.
    expect(isSessionStale({ startedAt: new Date(now).toISOString() }, staleMs, now)).toBe(false);
    expect(isSessionStale({}, staleMs, now)).toBe(false);
  });

  test("lastActivityAt picks the newest heartbeat", () => {
    const result = lastActivityAt({
      startedAt: "2026-10-03T11:00:00.000Z",
      userHeartbeatAt: "2026-10-03T11:30:00.000Z",
      expertHeartbeatAt: "2026-10-03T11:45:00.000Z",
    });
    expect(result.toISOString()).toBe("2026-10-03T11:45:00.000Z");
  });
});

describe("ICE servers", () => {
  test("always offers public STUN", () => {
    const servers = buildIceServers({});
    expect(servers.length).toBeGreaterThan(0);
    expect(servers[0].urls.some((u) => u.startsWith("stun:"))).toBe(true);
    expect(servers.some((s) => s.username)).toBe(false);
  });

  test("adds TURN (with credentials) only when configured", () => {
    const servers = buildIceServers({
      turnUrls: "turn:turn.example.com:3478?transport=udp, turn:turn.example.com:3478?transport=tcp",
      turnUsername: "user",
      turnCredential: "pass",
    });

    const turn = servers.find((s) => s.urls.some((u) => u.startsWith("turn:")));
    expect(turn).toBeTruthy();
    expect(turn.urls).toHaveLength(2);
    expect(turn.username).toBe("user");
    expect(turn.credential).toBe("pass");
  });
});
