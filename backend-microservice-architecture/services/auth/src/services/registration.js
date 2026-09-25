import { conflictError, validationError } from "@lifebookz/shared-errors";

import { ACCOUNT_ROLES } from "../models/account.js";
import { hashPassword } from "./crypto.js";
import { resolveUsername } from "./username.js";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Registration.
 *
 * The monolith has one register endpoint per portal
 * (`/users|authors|experts/register`) with three different field sets. Here a
 * single endpoint takes a `role`, because identity is identical for all three
 * and only the *profile* differs — and the profile belongs to the domain that
 * uses it (author profile → Story, expert profile → Consultation).
 *
 * Everything downstream is event driven: `AccountRegistered` starts the
 * welcome email (via Notification) and tells Story/Consultation/System to
 * create their projections.
 */
export function createRegistrationService({ accounts, sessions, publisher, logger, cfg }) {
  return {
    async register({ role, email, password, fullName, username, ip }) {
      if (!ACCOUNT_ROLES.includes(role)) {
        throw validationError("Choose a valid account type.", {
          fields: { role: `role must be one of: ${ACCOUNT_ROLES.join(", ")}.` },
        });
      }

      const cleanEmail = String(email || "").trim().toLowerCase();

      if (await accounts.emailExists(cleanEmail)) {
        const message = `An ${role} account with this email already exists.`;

        throw conflictError(message, { email: message });
      }

      if (String(password || "").length < MIN_PASSWORD_LENGTH) {
        throw validationError("Password must be at least 8 characters.", {
          fields: { password: "Password must be at least 8 characters." },
        });
      }

      const resolvedUsername = await resolveUsername({ role, username, email: cleanEmail, fullName, accounts });
      const passwordHash = await hashPassword(password, cfg?.bcryptRounds ?? 12);

      const account = await accounts.create({
        role,
        email: cleanEmail,
        username: resolvedUsername,
        fullName: String(fullName).trim(),
        credentials: { passwordHash, passwordUpdatedAt: new Date() },
        // Readers are usable immediately; authors and experts go through the
        // admin application review that already exists in the product.
        verification: { status: role === "user" ? "approved" : "pending", verifiedAt: role === "user" ? new Date() : null },
      });

      const session = await sessions.issue({ account, role });

      await publisher?.publishSafely({
        type: "AccountRegistered",
        data: {
          accountId: String(account.id || account._id),
          role,
          email: account.email,
          username: account.username,
          fullName: account.fullName,
        },
        actor: { accountId: String(account.id || account._id), role },
      });

      logger?.info?.("Account registered", { accountId: String(account.id || account._id), role, ip });

      return { account: publicAccount(account), ...session };
    },
  };
}

/** Shape returned to the portals — matches what the existing frontends read. */
export function publicAccount(account) {
  return {
    id: String(account.id || account._id),
    role: account.role,
    email: account.email,
    username: account.username,
    fullName: account.fullName,
    avatar: account.avatar || { url: "", key: "" },
    coverImage: account.coverImage || { url: "", key: "" },
    coverImageMobile: account.coverImageMobile || { url: "", key: "" },
    status: account.status,
    verification: account.verification
      ? { status: account.verification.status, rejectionReason: account.verification.rejectionReason || "" }
      : undefined,
    createdAt: account.createdAt,
  };
}
