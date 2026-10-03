import { sendEmailSafely } from "../services/email.service.js";
import { applicationSubmittedEmail } from "../emails/index.js";

export async function sendApplicationSubmitted(authorEmail, authorName) {
  const { subject, html } = applicationSubmittedEmail({
    name: authorName,
    role: "author",
  });

  await sendEmailSafely({ to: authorEmail, subject, html });
}
