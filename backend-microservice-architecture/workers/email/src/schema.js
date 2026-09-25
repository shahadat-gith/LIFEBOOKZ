import { z } from "zod";

/**
 * Email job schema — the contract between Notification (the producer) and the
 * Email Worker (the consumer).
 *
 * Every field the SES call needs travels inside the message, so the worker is
 * fully self-contained: it holds no user database, no template engine state
 * beyond what is bundled with the deployment.
 */
export const emailJobSchema = z.object({
  jobId: z.string().min(8).max(200),
  jobVersion: z.number().int().min(1),
  type: z.literal("email"),
  template: z.enum([
    "welcome",
    "password-reset-otp",
    "booking-requested",
    "booking-status",
    "application-approved",
    "application-rejected",
  ]),
  to: z.string().email(),
  toName: z.string().max(200).optional(),
  replyTo: z.string().email().optional(),
  data: z.record(z.unknown()).default({}),
  sourceEventId: z.string().min(8).max(200),
  queuedAt: z.string().datetime(),
});

export function parseEmailJob(raw) {
  const parsed = emailJobSchema.safeParse(raw);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const error = new Error(
      `Invalid email job at "${issue?.path?.join(".") || "?"}": ${issue?.message || "schema mismatch"}`,
    );
    error.permanent = true;
    throw error;
  }

  return parsed.data;
}

export const EMAIL_TEMPLATES = emailJobSchema.shape.template.options;
