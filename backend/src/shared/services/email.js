import config from '../config/index.js';
import { getTransporter } from '../config/nodemailer.js';
import log from '../utils/logger.js';

async function sendEmail({ to, subject, text }) {
  const from = config.mail.user || 'noreply@lifebookz.com';

  if (config.mail.user && config.mail.password) {
    try {
      const t = getTransporter();
      const info = await t.sendMail({
        from: `"Lifebookz" <${from}>`,
        to,
        subject,
        text,
      });
      await log('info', 'Email sent', { to, subject, messageId: info.messageId });
      return info;
    } catch (error) {
      await log('error', 'Failed to send email via SMTP', {
        to,
        subject,
        error: error.message,
      });
    }
  }
}

export { sendEmail };
