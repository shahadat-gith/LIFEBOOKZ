import { SendEmailCommand } from "@aws-sdk/client-sesv2";

import { getSesClient, getSesSender, isSesConfigured } from "../config/ses.js";
import { logger } from "./logger.js";

/**
 * Send a single HTML email through Amazon SES.
 *
 * @param {Object} params
 * @param {string} params.to       Recipient address.
 * @param {string} params.subject  Subject line.
 * @param {string} params.html     Rendered HTML body (see core/email-templates).
 * @param {string} [params.replyTo]
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  if (!isSesConfigured()) {
    throw new Error(
      "Email is not configured. Set AWS_ACCESS_KEY and AWS_SECRET_KEY.",
    );
  }

  if (!to) {
    throw new Error("Email requires a recipient.");
  }

  const command = new SendEmailCommand({
    FromEmailAddress: getSesSender(),
    Destination: { ToAddresses: [to] },
    ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Html: { Data: html, Charset: "UTF-8" } },
      },
    },
  });

  return getSesClient().send(command);
}

/**
 * Send an email that must never break the request that triggered it.
 *
 * Signing up and resetting a password should succeed even if SES is down, so
 * these call sites use this and rely on the log entry instead of an error.
 */
export async function sendEmailSafely(payload) {
  try {
    return await sendEmail(payload);
  } catch (error) {
    logger.warn("Email delivery failed", {
      to: payload?.to,
      subject: payload?.subject,
      error: error.message,
    });

    return null;
  }
}
