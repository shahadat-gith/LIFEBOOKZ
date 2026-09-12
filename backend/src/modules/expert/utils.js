import { sendEmail } from "../../core/services/email.js";
import * as Errors from "../../core/utils/errors.js";
import { CONSULT_CATEGORY_IDS } from "./constants.js";

/* ---------- Form field parsing ---------- */

/**
 * Multipart form fields arrive as strings. Accept a JSON array, a comma
 * separated list or an already-parsed array and return clean category ids.
 */
export function parseCategories(raw) {
  if (Array.isArray(raw)) {
    return raw.map((c) => String(c).trim()).filter(Boolean);
  }

  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((c) => String(c).trim()).filter(Boolean);
    }
  } catch {
    // Not JSON — fall back to comma separated handling below.
  }

  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Validate category ids against the canonical list and de-duplicate them
 * while preserving the submitted order.
 */
export function validateCategories(categories) {
  if (!categories.length) {
    throw new Errors.ValidationError(
      "Select at least one consultancy category.",
    );
  }

  const invalid = categories.filter(
    (c) => !CONSULT_CATEGORY_IDS.includes(c),
  );

  if (invalid.length) {
    throw new Errors.ValidationError(
      `Unknown consultancy category: ${invalid.join(", ")}.`,
    );
  }

  return [...new Set(categories)];
}

/**
 * Accept a JSON array or comma separated string of languages and always
 * return a non-empty list.
 */
export function parseLanguages(raw) {
  if (Array.isArray(raw)) {
    return raw.map((l) => String(l).trim()).filter(Boolean);
  }

  if (typeof raw !== "string" || !raw.trim()) return ["English"];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.map((l) => String(l).trim()).filter(Boolean);
      return cleaned.length ? cleaned : ["English"];
    }
  } catch {
    // Not JSON — treat as comma separated.
  }

  const cleaned = raw
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  return cleaned.length ? cleaned : ["English"];
}

/* ---------- Notifications ---------- */

export async function sendExpertApproved(expertEmail, expertName) {
  const subject = "Welcome to LifeBookz — Your Expert Account is Approved! 🎉";

  const text = `Hi ${expertName},

Congratulations!

Your expert application has been approved and your LifeBookz expert account is now active.

You can now:
• Receive consultation bookings from people who need your guidance
• Manage your upcoming and past sessions from your expert dashboard
• Keep your profile, expertise and categories up to date

Sign in to your expert dashboard to get started.

We're excited to have you as part of the LifeBookz community.

Best regards,
The LifeBookz Team`;

  await sendEmail({ to: expertEmail, subject, text });
}

export async function sendExpertRejected(expertEmail, expertName, reason) {
  const subject = "Update on Your LifeBookz Expert Application";

  const text = `Hi ${expertName},

Thank you for your interest in becoming a LifeBookz expert.

After reviewing your application, we're unable to approve it at this time.

Reason:
${reason || "No specific reason was provided."}

You are welcome to update your information and submit a new application in the future.

If you believe this decision was made in error, please contact our support team.

Thank you for your interest in LifeBookz.

Best regards,
The LifeBookz Team`;

  await sendEmail({ to: expertEmail, subject, text });
}
