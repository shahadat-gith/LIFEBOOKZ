import { sendEmailSafely } from "../../core/services/email.js";
import { applicationSubmittedEmail } from "../../core/email-templates/index.js";

export async function sendApplicationSubmitted(authorEmail, authorName) {
  const { subject, html } = applicationSubmittedEmail({
    name: authorName,
    role: "author",
  });

  await sendEmailSafely({ to: authorEmail, subject, html });
}
