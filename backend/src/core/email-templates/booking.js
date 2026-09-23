import config from "../config/index.js";
import { layout, BRAND } from "./layout.js";

const STATUS_COPY = {
  pending: {
    subject: "Your consultation request is pending",
    line: "Your request has been received. The expert will confirm shortly.",
  },
  confirmed: {
    subject: "Your consultation is confirmed",
    line: "Good news — your consultation has been confirmed. Please be available at the scheduled time.",
  },
  completed: {
    subject: "Your consultation is complete",
    line: "Your consultation is marked complete. We hope it was helpful.",
  },
  cancelled: {
    subject: "Your consultation was cancelled",
    line: "This consultation has been cancelled. You can book another session any time.",
  },
};

/** The session summary shared by both booking mails. */
function sessionDetails({ sessionType, date, time }) {
  return `
    <div style="margin:20px 0;padding:16px;background:${BRAND.background};border:1px solid ${BRAND.border};border-radius:12px;font-size:13px;line-height:1.9;color:${BRAND.muted}">
      <div><strong style="color:${BRAND.foreground}">Type</strong>&nbsp; ${sessionType || "video"}</div>
      <div><strong style="color:${BRAND.foreground}">Date</strong>&nbsp; ${date || "To be decided"}</div>
      <div><strong style="color:${BRAND.foreground}">Time</strong>&nbsp; ${time || "To be decided"}</div>
    </div>
  `;
}

/** Sent to the expert when a client books a session. */
export function bookingRequestedEmail({
  expertName,
  clientName,
  sessionType,
  date,
  time,
  problem,
}) {
  return {
    subject: "New consultation request on LifeBookz",
    html: layout({
      preheader: `${clientName || "A client"} requested a session with you.`,
      heading: `New request from ${clientName || "a client"}`,
      body: `
        <p style="margin:0">Hi ${expertName || "there"}, a client has requested a consultation with you.</p>
        ${sessionDetails({ sessionType, date, time })}
        <p style="margin:0"><strong style="color:${BRAND.foreground}">What they need help with</strong><br />${problem || "No details provided."}</p>
      `,
      cta: config.frontend.expert
        ? { label: "Review the request", href: config.frontend.expert }
        : null,
    }),
  };
}

/** Sent to the client whenever the expert moves the booking to a new status. */
export function bookingStatusEmail({
  clientName,
  expertName,
  status,
  sessionType,
  date,
  time,
}) {
  const copy = STATUS_COPY[status] ?? STATUS_COPY.pending;

  return {
    subject: `LifeBookz — ${copy.subject}`,
    html: layout({
      preheader: copy.line,
      heading: `Hi ${clientName || "there"}`,
      body: `
        <p style="margin:0">${copy.line}</p>
        <p style="margin:16px 0 0">Your session with <strong style="color:${BRAND.foreground}">${expertName || "your expert"}</strong>:</p>
        ${sessionDetails({ sessionType, date, time })}
      `,
      cta: config.frontend.client
        ? { label: "View your bookings", href: config.frontend.client }
        : null,
    }),
  };
}
