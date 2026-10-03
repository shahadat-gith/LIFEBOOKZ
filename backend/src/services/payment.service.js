import Razorpay from "razorpay";
import config from "../config/index.js";
import { logger } from "./logger.service.js";

import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../utils/consultation.js";
import { validationError, serviceUnavailableError } from "../utils/errors.js";

let client = null;

function razorpayClient() {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw serviceUnavailableError(
      "Payments are not configured on this server. Please try again later.",
    );
  }

  if (!client) {
    client = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  return client;
}

/**
 * Creates the Razorpay order for an accepted consultation.
 *
 * The amount ALWAYS comes from the consultation record (set when the expert
 * accepted), never from the request body.
 */
export async function createOrder({ consultation }) {
  try {
    const order = await razorpayClient().orders.create({
      amount: consultation.amount,
      currency: consultation.currency || "INR",
      receipt: `consult_${consultation.id}`,
      notes: {
        consultationId: consultation.id,
        userId: String(consultation.user?._id || consultation.user),
        expertId: String(consultation.expert?._id || consultation.expert),
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // The checkout needs the public key id.
      keyId: config.razorpay.keyId,
    };
  } catch (error) {
    logger.error("Failed to create Razorpay order", {
      consultationId: consultation.id,
      reason: error?.error?.description || error.message,
    });
    throw serviceUnavailableError(
      "Could not start the payment. Please try again in a moment.",
    );
  }
}

/**
 * Verifies the checkout handshake. Returns the verified identifiers, or
 * throws — the consultation is only confirmed after this passes.
 */
export function verifyCheckout({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) {
    throw validationError(
      "Payment verification requires order id, payment id and signature.",
    );
  }

  const ok = verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
    secret: config.razorpay.keySecret,
  });

  if (!ok) {
    logger.warn("Razorpay checkout signature verification failed", {
      orderId,
      paymentId,
    });
    throw validationError("Payment signature verification failed.");
  }

  return { orderId, paymentId, signature };
}

/**
 * Verifies the `x-razorpay-signature` header against the raw request body.
 * The webhook route must feed this the UNPARSED body (see app.js).
 */
export function verifyWebhook(rawBody, signature) {
  if (!config.razorpay.webhookSecret) {
    logger.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.");
    return false;
  }
  return verifyWebhookSignature(rawBody, signature, config.razorpay.webhookSecret);
}

/** Public checkout configuration for the frontend. */
export function checkoutConfig() {
  if (!config.razorpay.keyId) {
    throw serviceUnavailableError("Payments are not configured on this server.");
  }
  return { keyId: config.razorpay.keyId, currency: "INR" };
}

export function isConfigured() {
  return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
}
