import config from "../config/index.js";
import { layout, BRAND } from "./layout.js";

/** The booking summary block shared by the mails. */
function bookingDetails({ category }) {
  return `
    <div style="margin:20px 0;padding:16px;background:${BRAND.background};border:1px solid ${BRAND.border};border-radius:12px;font-size:13px;line-height:1.9;color:${BRAND.muted}">
      <div><strong style="color:${BRAND.foreground}">Category</strong>&nbsp; ${category || "General consultation"}</div>
    </div>
  `;
}

/** Sent to the expert when a client books — asks them to confirm or reject. */
export function bookingRequestedEmail({
  expertName,
  clientName,
  clientEmail,
  category,
  problem,
}) {
  return {
    subject: "New consultation request on LifeBookz",
    html: layout({
      preheader: `${clientName || "A client"} requested a session with you.`,
      heading: `New request from ${clientName || "a client"}`,
      body: `
        <p style="margin:0">Hi ${expertName || "there"}, a client has requested a consultation with you.</p>
        ${bookingDetails({ category, clientEmail })}
        <p style="margin:0"><strong style="color:${BRAND.foreground}">What they need help with</strong><br />${problem || "No details provided."}</p>
        <p style="margin:16px 0 0">Open your dashboard to confirm or reject this booking.</p>
      `,
      cta: config.frontend.expert
        ? { label: "Open dashboard to review", href: config.frontend.expert }
        : null,
    }),
  };
}

/** Sent to the client after the expert confirms or rejects. */
export function bookingStatusEmail({
  clientName,
  expertName,
  status,
  roomUrl,
  bookingsUrl,
  amountLabel,
  reason,
}) {
  if (status === "confirmed") {
    return {
      subject: "Your consultation is confirmed",
      html: layout({
        preheader: "Your session is confirmed — join the room to start.",
        heading: `Hi ${clientName || "there"}, you're confirmed!`,
        body: `
          <p style="margin:0"><strong style="color:${BRAND.foreground}">${expertName || "Your expert"}</strong> has confirmed your consultation session.</p>
          ${amountLabel ? `<p style="margin:12px 0 0">Session fee: <strong style="color:${BRAND.foreground}">${amountLabel}</strong> — you'll complete the payment when you enter the room.</p>` : ""}
          <p style="margin:12px 0 0">Open the room below. The session starts as soon as you've paid and joined.</p>
        `,
        cta: roomUrl ? { label: "Join the session room", href: roomUrl } : null,
      }),
    };
  }

  if (status === "completed") {
    return {
      subject: "Your consultation is complete — share your experience",
      html: layout({
        preheader: "Your session has ended. Tell us how it went.",
        heading: `Hi ${clientName || "there"}, how was your session?`,
        body: `
          <p style="margin:0">Your session with <strong style="color:${BRAND.foreground}">${expertName || "your expert"}</strong> has ended.</p>
          <p style="margin:12px 0 0">Take a moment to rate the session and share your experience — it helps other people choose well and helps your expert grow.</p>
        `,
        cta: bookingsUrl
          ? { label: "Rate this session", href: bookingsUrl }
          : null,
      }),
    };
  }

  // Cancelled / rejected
  return {
    subject: "Your consultation was cancelled",
    html: layout({
      preheader: "This consultation has been cancelled.",
      heading: `Hi ${clientName || "there"}`,
      body: `
        <p style="margin:0">Your consultation with <strong style="color:${BRAND.foreground}">${expertName || "your expert"}</strong> has been cancelled.</p>
        ${reason ? `<p style="margin:12px 0 0">Reason: ${reason}</p>` : ""}
        <p style="margin:12px 0 0">You can request a session with another expert any time.</p>
      `,
      cta: config.frontend.client
        ? { label: "Find another expert", href: config.frontend.client + "/consult/book" }
        : null,
    }),
  };
}
