import config from "../config/index.js";
import { layout } from "./layout.js";

/**
 * Welcome mail sent the moment an account is created.
 *
 * Each role gets its own short line about what the account can do and a link
 * into that role's portal, so a reader never lands on the author dashboard.
 */
const ROLES = {
  user: {
    label: "reader",
    blurb:
      "You can now read life stories from real people, follow your favourite authors and save the ones that move you.",
    portal: () => config.frontend.client,
    action: "Start reading",
  },
  author: {
    label: "author",
    blurb:
      "Your author account is ready. Write your lifebook chapter by chapter, add photos and videos, and publish when it feels right.",
    portal: () => config.frontend.author,
    action: "Start writing",
  },
  expert: {
    label: "expert",
    blurb:
      "Your expert account is ready. Complete your profile so people can find you, and manage your consultation sessions from your dashboard.",
    portal: () => config.frontend.expert,
    action: "Open your dashboard",
  },
};

export function welcomeEmail({ name, role = "user" }) {
  const preset = ROLES[role] ?? ROLES.user;
  const url = preset.portal();

  return {
    subject: "Welcome to LifeBookz",
    html: layout({
      preheader: "Your LifeBookz account is ready.",
      heading: `Welcome to LifeBookz, ${name || "friend"}`,
      body: `
        <p style="margin:0">Thanks for joining us. ${preset.blurb}</p>
        <p style="margin:16px 0 0">Everything you write belongs to you — you can edit, update or delete it at any time.</p>
      `,
      cta: url ? { label: preset.action, href: url } : null,
    }),
  };
}

export { ROLES as WELCOME_ROLES };
