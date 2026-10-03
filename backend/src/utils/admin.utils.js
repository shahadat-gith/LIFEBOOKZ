import { sendEmailSafely } from "../services/email.service.js";
import {
  applicationApprovedEmail,
  applicationRejectedEmail,
} from "../emails/index.js";

export async function sendApplicationApproved(email, name, role = "author") {
  const { subject, html } = applicationApprovedEmail({ name, role });
  await sendEmailSafely({ to: email, subject, html });
}

export async function sendApplicationRejected(email, name, reason, role = "author") {
  const { subject, html } = applicationRejectedEmail({ name, role, reason });
  await sendEmailSafely({ to: email, subject, html });
}
