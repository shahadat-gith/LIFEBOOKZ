import config from "../config/index.js";
import { getTransporter } from "../config/nodemailer.js";

export async function sendEmail({ to, subject, text }) {
  if (!config.mail.user || !config.mail.password) {
    throw new Error("SMTP is not configured.");
  }

  const transporter = getTransporter();

  return transporter.sendMail({
    from: `"LifeBookz" <${config.mail.user}>`,
    to,
    subject,
    text,
  });
}