import { sendEmail } from "../shared/services/email.js";

export async function sendApplicationApproved(authorEmail, authorName) {
  const subject = "Your Author Application Has Been Approved! 🎉";
  const text = `Hi ${authorName},

Great news! Your author application has been approved. You can now start writing and publishing stories on Lifebookz.

Head over to your dashboard to create your first story!

Best regards,
The Lifebookz Team`;

  await sendEmail({ to: authorEmail, subject, text });
}

export async function sendApplicationRejected(authorEmail, authorName, reason) {
  const subject = "Update on Your Author Application";
  const text = `Hi ${authorName},

We've reviewed your author application, and unfortunately we are unable to approve it at this time.

Reason: ${reason || "Not specified"}

You are welcome to re-apply with updated information.

Best regards,
The Lifebookz Team`;

  await sendEmail({ to: authorEmail, subject, text });
}
