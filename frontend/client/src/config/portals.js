import { Icons } from "../icons";

/**
 * Secondary LifeBookz portals (author, expert, admin, developer).
 *
 * Each portal is a standalone app with its own login. In development we fall
 * back to the local Vite ports so `npm run dev` works without extra setup; in
 * production we fall back to the public subdomains. Setting the matching
 * `VITE_*_PORTAL` env var in `frontend/client/.env` overrides both.
 */
const DEV_PORTS = {
  author: 5174,
  admin: 5175,
  expert: 5176,
  developer: 5177,
};

function resolvePortalUrl(envValue, subdomain) {
  const configured = envValue?.trim();

  if (configured) return configured.replace(/\/+$/, "");

  return import.meta.env.DEV
    ? `http://localhost:${DEV_PORTS[subdomain]}`
    : `https://${subdomain}.lifebookz.com`;
}

export const PORTALS = [
  {
    id: "author",
    name: "Author Studio",
    tagline: "Write and publish your stories",
    group: "contribute",
    icon: Icons.edit,
    url: resolvePortalUrl(import.meta.env.VITE_AUTHOR_PORTAL, "author"),
  },
  {
    id: "expert",
    name: "Expert Desk",
    tagline: "Manage consultations and bookings",
    group: "contribute",
    icon: Icons.briefcase,
    url: resolvePortalUrl(import.meta.env.VITE_EXPERT_PORTAL, "expert"),
  },
  {
    id: "admin",
    name: "Admin Console",
    tagline: "Review applications and moderation",
    group: "staff",
    icon: Icons.shieldCheck,
    url: resolvePortalUrl(import.meta.env.VITE_ADMIN_PORTAL, "admin"),
  },
  {
    id: "developer",
    name: "Developer Console",
    tagline: "Application logs and diagnostics",
    group: "staff",
    icon: Icons.code,
    url: resolvePortalUrl(import.meta.env.VITE_DEVELOPER_PORTAL, "developer"),
  },
];

export const CONTRIBUTOR_PORTALS = PORTALS.filter(
  (portal) => portal.group === "contribute",
);

export const STAFF_PORTALS = PORTALS.filter(
  (portal) => portal.group === "staff",
);

export function portalLoginUrl(portal) {
  return `${portal.url}/login`;
}

export default PORTALS;
