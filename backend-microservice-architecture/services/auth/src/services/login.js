import {
  authenticationError,
  serviceUnavailableError,
  tooManyRequestsError,
  validationError,
} from "@lifebookz/shared-errors";

import { ACCOUNT_ROLES } from "../models/account.js";
import { safeEqual, verifyPassword } from "./crypto.js";
import { publicAccount } from "./registration.js";

const ROLE_LABELS = { user: "reader", author: "author", expert: "expert" };
const PRIVILEGED_ROLES = ["admin", "developer"];
const LOGIN_WINDOW_SECONDS = 900;

/**
 * What to tell someone whose email has no account in the portal they typed it
 * into — carried over verbatim from the existing backend, including the
 * cross-portal hint, because it is the single most common sign-in mistake.
 */
export function noAccountMessage(roles, portalRole) {
  const elsewhere = roles.filter((role) => role !== portalRole).map((role) => ROLE_LABELS[role]);

  if (elsewhere.length === 0) return "No account found with this email.";

  const list =
    elsewhere.length === 1 ? elsewhere[0] : `${elsewhere.slice(0, -1).join(", ")} or ${elsewhere.at(-1)}`;

  return `No account found with this email — it is registered as a ${list} account.`;
}

/**
 * Login.
 *
 * Admin/developer sign-in lives here too (not in System): Auth is the only
 * component allowed to mint a token, and privileged credentials come from
 * Secrets Manager rather than a database collection, so a database leak can
 * never become an admin session.
 */
export function createLoginService({ accounts, sessions, privilegedCredentials, rateLimiter, publisher, logger, cfg }) {
  async function throttle({ role, email, ip }) {
    if (!rateLimiter) return;

    const limit = cfg?.loginAttemptLimitPerWindow ?? 10;
    const attempt = await rateLimiter.consume({
      key: `login:${role}:${String(email).toLowerCase()}`,
      limit,
      windowSeconds: LOGIN_WINDOW_SECONDS,
    });

    if (!attempt.allowed) {
      logger?.warn?.("Login throttled", { role, email, ip, count: attempt.count });
      throw tooManyRequestsError(
        "Too many sign-in attempts. Please wait a few minutes and try again.",
        { retryAfterSeconds: attempt.retryAfterSeconds },
      );
    }
  }

  async function loginPrivileged({ role, email, password, ip }) {
    const configured = await privilegedCredentials.get(role);

    if (!configured?.email || !configured?.password) {
      throw serviceUnavailableError(`${role} access is not configured on this server.`);
    }

    const emailMatches = safeEqual(String(email || "").trim().toLowerCase(), String(configured.email).toLowerCase());
    const passwordMatches = safeEqual(String(password || ""), String(configured.password));

    if (!emailMatches || !passwordMatches) {
      logger?.warn?.("Privileged login failed", { role, email, ip, emailMatches });

      const message = emailMatches ? `Incorrect ${role} password.` : `Incorrect ${role} email.`;

      throw authenticationError(message, { [emailMatches ? "password" : "email"]: message });
    }

    const account = {
      id: `${role}:${configured.email}`,
      role,
      email: configured.email,
      username: role,
      credentials: { tokenVersion: 0 },
    };

    const session = await sessions.issue({ account, role });

    await publisher?.publishSafely({
      type: "PrivilegedLoginRecorded",
      data: { role, email: configured.email, ip: ip || null },
      actor: { accountId: account.id, role },
    });

    logger?.info?.("Privileged login", { role, ip });

    return { account: { id: account.id, role, email: account.email }, ...session };
  }

  return {
    async login({ role, email, password, ip }) {
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (PRIVILEGED_ROLES.includes(role)) {
        await throttle({ role, email: cleanEmail || "unknown", ip });
        return loginPrivileged({ role, email: cleanEmail, password, ip });
      }

      if (!ACCOUNT_ROLES.includes(role)) {
        throw validationError("Choose a valid account type.", {
          fields: { role: `role must be one of: ${[...ACCOUNT_ROLES, ...PRIVILEGED_ROLES].join(", ")}.` },
        });
      }

      await throttle({ role, email: cleanEmail, ip });

      const account = await accounts.findByEmail(cleanEmail, { withSecrets: true });

      if (!account || account.role !== role) {
        const roles = await accounts.findRolesByEmail(cleanEmail);
        const message = noAccountMessage(roles, role);

        logger?.warn?.("Login failed — no account for this portal", { role, email: cleanEmail, roles, ip });

        throw authenticationError(message, { email: message });
      }

      const passwordMatches = await verifyPassword(password, account.credentials?.passwordHash);

      if (!passwordMatches) {
        logger?.warn?.("Login failed — incorrect password", { accountId: String(account._id), role, ip });

        const message = "Incorrect password. Try again, or reset it.";

        throw authenticationError(message, { password: message });
      }

      if (account.status !== "active") {
        throw authenticationError("This account is not active. Please contact support.");
      }

      const session = await sessions.issue({ account, role });

      await accounts.setLastLogin(account._id);

      logger?.info?.("Login succeeded", { accountId: String(account._id), role, ip });

      return { account: publicAccount(account), ...session };
    },
  };
}
