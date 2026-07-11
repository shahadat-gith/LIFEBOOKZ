import log from '../utils/logger.js';

/**
 * Email Service
 *
 * Currently logs emails to console. To enable actual email delivery,
 * set SMTP_* env vars and uncomment the nodemailer transport below.
 *
 * Required env vars for production:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */

async function sendEmail({ to, subject, text }) {
  const from = process.env.EMAIL_FROM || 'noreply@lifebookz.com';

  await log('info', `Email notification`, { to, subject, text: text?.slice(0, 200), from });

  console.log('\n' + '='.repeat(60));
  console.log(`📧 EMAIL TO: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body:\n${text}`);
  console.log('='.repeat(60) + '\n');
}

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

export async function sendApplicationApproved(authorEmail, authorName) {
  const subject = 'Your Author Application Has Been Approved! 🎉';
  const text = `Hi ${authorName},

Great news! Your author application has been approved. You can now start writing and publishing stories on Lifebookz.

Head over to your dashboard to create your first story!

Best regards,
The Lifebookz Team`;

  await sendEmail({ to: authorEmail, subject, text });
}

export async function sendApplicationRejected(authorEmail, authorName, reason) {
  const subject = 'Update on Your Author Application';
  const text = `Hi ${authorName},

We've reviewed your author application, and unfortunately we are unable to approve it at this time.

Reason: ${reason || 'Not specified'}

You are welcome to re-apply with updated information.

Best regards,
The Lifebookz Team`;

  await sendEmail({ to: authorEmail, subject, text });
}
