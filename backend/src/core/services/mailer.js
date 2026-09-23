import { sendEmailSafely } from "./email.js";
import {
  welcomeEmail,
  otpEmail,
  bookingRequestedEmail,
  bookingStatusEmail,
} from "../email-templates/index.js";

/**
 * Template + transport in one call.
 *
 * Every mail here is sent "safely": the triggering request (signup, password
 * reset) must succeed even when SES is unavailable, so failures only reach
 * the log.
 */

export function sendWelcomeMail({ to, name, role }) {
  const { subject, html } = welcomeEmail({ name, role });
  return sendEmailSafely({ to, subject, html });
}

export function sendOtpMail({ to, otp, role }) {
  const { subject, html } = otpEmail({ otp, role });
  return sendEmailSafely({ to, subject, html });
}

/** Tells the expert a client has asked for a session. */
export function sendBookingRequestMail({ to, ...details }) {
  const { subject, html } = bookingRequestedEmail(details);
  return sendEmailSafely({ to, subject, html });
}

/** Tells the client the expert changed the booking status. */
export function sendBookingStatusMail({ to, ...details }) {
  const { subject, html } = bookingStatusEmail(details);
  return sendEmailSafely({ to, subject, html });
}
