import { sendEmail } from "../shared/services/email.js";

export async function sendApplicationApproved(authorEmail, authorName) {
  const subject = "Welcome to LifeBookz — Your Author Account is Approved! 🎉";

  const text = `Hi ${authorName},

Congratulations!

Your author application has been approved, and your LifeBookz author account is now active.

You can now:
• Create and publish your own stories
• Build your author profile
• Connect with readers around the world

Sign in to your account and start sharing your stories.

We're excited to have you as part of the LifeBookz community.

Happy writing!

Best regards,
The LifeBookz Team`;

  await sendEmail({
    to: authorEmail,
    subject,
    text,
  });
}

export async function sendApplicationRejected(authorEmail, authorName, reason) {
  const subject = "Update on Your LifeBookz Author Application";

  const text = `Hi ${authorName},

Thank you for your interest in becoming a LifeBookz author.

After reviewing your application, we're unable to approve it at this time.

Reason:
${reason || "No specific reason was provided."}

You are welcome to update your information and submit a new application in the future.

If you believe this decision was made in error, please contact our support team.

Thank you for your interest in LifeBookz.

Best regards,
The LifeBookz Team`;

  await sendEmail({
    to: authorEmail,
    subject,
    text,
  });
}
