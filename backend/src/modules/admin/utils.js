import { sendEmailSafely } from "../../core/services/email.js";
import {
  applicationApprovedEmail,
  applicationRejectedEmail,
} from "../../core/email-templates/index.js";

export async function sendApplicationApproved(email, name, role = "author") {
  const { subject, html } = applicationApprovedEmail({ name, role });
  await sendEmailSafely({ to: email, subject, html });
}

export async function sendApplicationRejected(email, name, reason, role = "author") {
  const { subject, html } = applicationRejectedEmail({ name, role, reason });
  await sendEmailSafely({ to: email, subject, html });
}
