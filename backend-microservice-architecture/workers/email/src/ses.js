import {
  SendEmailCommand,
  SESv2Client,
} from "@aws-sdk/client-sesv2";

/**
 * SES gateway for the email worker.
 *
 * `send` throws so the SQS event-source mapping can drive retries (transient
 * SES throttling, 5xx). `MessageRejected` without a transient flag is a
 * permanent failure (invalid address, suppressed recipient) and is surfaced
 * with `permanent = true` so the caller can route it to the DLQ immediately.
 */
export function createSesGateway({ region, client, configurationSetName, logger } = {}) {
  const ses = () => client || new SESv2Client({ region: region || process.env.SES_REGION || process.env.AWS_REGION });

  async function send(job, { from, fromName, replyTo: defaultReplyTo } = {}) {
    const subject = subjectFor(job);
    const html = htmlFor(job);

    const command = new SendEmailCommand({
      FromEmailAddress: fromName ? `${fromName} <${from}>` : from,
      ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
      Destination: { ToAddresses: [job.to] },
      ...(job.replyTo || defaultReplyTo ? { ReplyToAddresses: [job.replyTo || defaultReplyTo] } : {}),
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "utf-8" },
          Body: {
            Html: { Data: html, Charset: "utf-8" },
            Text: { Data: textFor(job), Charset: "utf-8" },
          },
        },
      },
    });

    try {
      const response = await ses().send(command);

      logger?.info?.("Email accepted by SES", {
        jobId: job.jobId,
        template: job.template,
        to: job.to,
        messageId: response?.MessageId || null,
      });

      return { messageId: response?.MessageId || null };
    } catch (error) {
      if (error?.name === "MessageRejected") {
        error.permanent = true;
      }

      logger?.error?.("SES send failed", {
        jobId: job.jobId,
        template: job.template,
        to: job.to,
        error: error.message,
        permanent: Boolean(error.permanent),
      });

      throw error;
    }
  }

  return { send };
}

/** Subject lines mirror the monolith's mailer (`core/services/mailer.js`). */
function subjectFor(job) {
  const name = job.data?.name || job.data?.clientName || job.data?.expertName || "";
  const first = String(name).split(" ")[0] || "there";

  switch (job.template) {
    case "welcome":
      return "Welcome to LifeBookz ✨";
    case "password-reset-otp":
      return `Your LifeBookz password reset code: ${job.data?.otp || "…"}`;
    case "booking-requested":
      return `New consultation request from ${first}`;
    case "booking-status":
      return `Your consultation request was ${job.data?.status || "updated"}`;
    case "application-approved":
      return "Your LifeBookz application was approved 🎉";
    case "application-rejected":
      return "Update on your LifeBookz application";
    default:
      return "LifeBookz";
  }
}

/** Fallback plain rendering — enough for every template the producer sends. */
function htmlFor(job) {
  const d = job.data || {};
  const name = d.name || d.clientName || d.expertName || "there";

  if (job.template === "password-reset-otp") {
    return `<p>Hi ${escapeHtml(name)},</p>
<p>Your LifeBookz password reset code is:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;">${escapeHtml(String(d.otp || ""))}</p>
<p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`;
  }

  if (job.template === "booking-requested") {
    return `<p>Hi ${escapeHtml(d.expertName || "there")},</p>
<p><strong>${escapeHtml(d.clientName || "A reader")}</strong> requested a ${escapeHtml(d.sessionType || "consultation")} session.</p>
${d.problem ? `<p>Concern: ${escapeHtml(String(d.problem)).slice(0, 1000)}</p>` : ""}
${d.preferredSlot ? `<p>Preferred slot: ${escapeHtml(String(d.preferredSlot))}</p>` : ""}
<p>Open your expert dashboard to confirm or decline.</p>`;
  }

  if (job.template === "booking-status") {
    return `<p>Hi ${escapeHtml(name)},</p>
<p>Your consultation request is now <strong>${escapeHtml(String(d.status || "updated"))}</strong>.</p>
${d.note ? `<p>Note from the expert: ${escapeHtml(String(d.note))}</p>` : ""}`;
  }

  if (job.template === "application-approved") {
    return `<p>Hi ${escapeHtml(name)},</p><p>Congratulations — your ${escapeHtml(String(d.role || "creator"))} application has been approved. You can now sign in and complete your profile.</p>`;
  }

  if (job.template === "application-rejected") {
    return `<p>Hi ${escapeHtml(name)},</p><p>After review, your application was not approved at this time.</p>${d.reason ? `<p>Reason: ${escapeHtml(String(d.reason))}</p>` : ""}<p>You can update your details and apply again.</p>`;
  }

  return `<p>Hi ${escapeHtml(name)},</p><p>Welcome to LifeBookz — start recording the stories that matter.</p>`;
}

function textFor(job) {
  return htmlFor(job)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
