import config from "../config/index.js";
import { layout } from "./layout.js";

/**
 * Mails for the author / expert application lifecycle.
 *
 * `role` picks the wording and the portal the CTA links into; the three
 * statuses share one layout so the set reads as a conversation.
 */
const ROLES = {
  author: {
    label: "author",
    approvedBlurb:
      "Your author application has been approved and your account is now active. You can create your lifebook, publish stories and connect with readers.",
    portal: () => config.frontend.author,
  },
  expert: {
    label: "expert",
    approvedBlurb:
      "Your expert application has been approved and your account is now active. You can receive consultation bookings and manage your sessions from your dashboard.",
    portal: () => config.frontend.expert,
  },
};

function presetFor(role) {
  return ROLES[role] ?? ROLES.author;
}

export function applicationSubmittedEmail({ name, role }) {
  const preset = presetFor(role);

  return {
    subject: `Your ${preset.label} application has been submitted`,
    html: layout({
      preheader: "We have received your application.",
      heading: `Thanks, ${name || "there"}`,
      body: `
        <p style="margin:0">We have received your LifeBookz ${preset.label} application and our team is reviewing it.</p>
        <p style="margin:16px 0 0">This usually takes 1&ndash;2 business days. We will email you as soon as there is an update.</p>
      `,
    }),
  };
}

export function applicationApprovedEmail({ name, role }) {
  const preset = presetFor(role);
  const url = preset.portal();

  return {
    subject: `Welcome to LifeBookz — your ${preset.label} account is approved`,
    html: layout({
      preheader: "Your application has been approved.",
      heading: `Congratulations, ${name || "there"}`,
      body: `<p style="margin:0">${preset.approvedBlurb}</p>`,
      cta: url ? { label: "Sign in to your account", href: url } : null,
    }),
  };
}

export function applicationRejectedEmail({ name, role, reason }) {
  const preset = presetFor(role);

  return {
    subject: `Update on your LifeBookz ${preset.label} application`,
    html: layout({
      preheader: "An update on your application.",
      heading: `Hi ${name || "there"}`,
      body: `
        <p style="margin:0">Thank you for your interest in becoming a LifeBookz ${preset.label}. After reviewing your application, we are unable to approve it at this time.</p>
        <p style="margin:16px 0 0"><strong style="color:#101b3c">Reason</strong><br />${reason || "No specific reason was provided."}</p>
        <p style="margin:16px 0 0">You are welcome to update your details and apply again in the future. If you believe this was a mistake, reply to this email and our team will take another look.</p>
      `,
    }),
  };
}
