import nodemailer from 'nodemailer';
import config from './index.js';

let transporter;

export function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.mail.user,
      pass: config.mail.password,
    },
  });

  return transporter;
}
