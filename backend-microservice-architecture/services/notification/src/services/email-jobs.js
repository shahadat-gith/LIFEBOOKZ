import { createHash } from "node:crypto";

/**
 * Email job routing.
 *
 * The Notification service decides *that* an email must be sent and *to whom*;
 * it never renders HTML and never talks to SES. It writes a small job to the
 * email queue and returns immediately, which is what keeps SES latency and SES
 * outages out of the request path.
 *
 * Every job carries a deterministic `jobId` derived from the source event, the
 * template and the recipient. A duplicate delivery of the same message
 * therefore produces the same job id, and the email worker's idempotency record
 * (DynamoDB, conditional write) rejects the second send. Determinism is the
 * whole point — a random id would make the worker's dedupe useless.
 */
export const EMAIL_TEMPLATES = [
  "welcome",
  "password-reset-otp",
  "booking-requested",
  "booking-status",
  "application-approved",
  "application-rejected",
];

export function buildJobId({ template, to, sourceEventId }) {
  return createHash("sha256").update(`${template}|${String(to).trim().toLowerCase()}|${sourceEventId}`).digest("hex").slice(0, 40);
}

export function createEmailJobService({ queue, config, logger }) {
  async function queueEmail({ template, to, toName, data = {}, sourceEventId, replyTo, tags = {} }) {
    if (!EMAIL_TEMPLATES.includes(template)) {
      throw new Error(`Unknown email template "${template}"`);
    }

    const recipient = String(to || "").trim().toLowerCase();

    if (!recipient) {
      logger?.warn?.("Email job skipped — no recipient address", { template, sourceEventId });
      return null;
    }

    const job = {
      jobId: buildJobId({ template, to: recipient, sourceEventId }),
      type: "email",
      jobVersion: 1,
      template,
      to: recipient,
      toName: toName || "",
      data,
      sourceEventId: sourceEventId || null,
      queuedAt: new Date().toISOString(),
      ...(replyTo ? { replyTo } : {}),
      ...(Object.keys(tags).length ? { tags } : {}),
    };

    // Queued safely: a mail problem must never fail the domain operation that
    // triggered it (the monolith did the same with `sendEmailSafely`).
    return queue.sendSafely(job);
  }

  return { queueEmail, templates: EMAIL_TEMPLATES };
}
