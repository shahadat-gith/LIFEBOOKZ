/**
 * Razorpay Checkout loader + modal opener.
 *
 * The order is ALWAYS created by the backend (`createPaymentOrder`); this
 * only opens the hosted checkout with that order and returns the handshake
 * fields, which the backend verifies before confirming the consultation.
 * No amount, key or result from the frontend is ever trusted.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise = null;

function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the payment module. Check your connection."));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Opens Razorpay Checkout.
 *
 * @param {{ keyId: string, orderId: string, amount: number, currency: string }} order
 *        from `POST /consult/:id/payment/order`
 * @param {{ name?: string, description?: string, prefill?: object }} [options]
 * @returns {Promise<{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }>}
 */
export function openRazorpayCheckout(order, options = {}) {
  return loadCheckoutScript().then(
    (Razorpay) =>
      new Promise((resolve, reject) => {
        const checkout = new Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || "INR",
          name: options.name || "LifeBookz",
          description: options.description || "Consultation payment",
          order_id: order.orderId,
          prefill: options.prefill || {},
          theme: options.theme || { color: "#f26d5f" },
          modal: {
            ondismiss: () =>
              reject(Object.assign(new Error("Payment cancelled."), { cancelled: true })),
          },
          handler: (response) => resolve(response),
        });

        checkout.on("payment.failed", (response) => {
          const reason =
            response?.error?.description || response?.error?.reason || "Payment failed.";
          reject(Object.assign(new Error(reason), { failed: true }));
        });

        checkout.open();
      }),
  );
}
