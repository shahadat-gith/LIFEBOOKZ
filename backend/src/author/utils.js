import { sendEmail } from "../shared/services/email.js"

export async function sendApplicationSubmitted(authorEmail, authorName) {
  const subject = 'Your Author Application Has Been Submitted';
  const text = `Hi ${authorName},

Thank you for submitting your author application to Lifebookz!

Your application is now under review by our admin team. We'll notify you once it has been reviewed.

This usually takes 1-2 business days.

Best regards,
The Lifebookz Team`;

  await sendEmail({ to: authorEmail, subject, text });
}

