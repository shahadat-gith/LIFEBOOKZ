import { validationError } from "@lifebookz/shared-errors";

/** Same rules the existing backend applies to usernames. */
export function sanitizeUsername(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

/**
 * Build a unique username from an email local part — the rule the monolith
 * used for readers (`buildUniqueUsername`) and its backfill script reuses.
 */
export async function buildUniqueUsername(email, accounts) {
  let base = String(email || "")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);

  if (base.length < 3) base = "user";

  let candidate = base;
  let suffix = 0;

  while (await accounts.usernameExists(candidate)) {
    suffix += 1;
    candidate = `${base}_${suffix}`.slice(0, 30);
  }

  return candidate;
}

/**
 * Author/expert signup still lets the person choose their handle; readers get
 * one derived from their email (exactly like the existing backend).
 */
export async function resolveUsername({ role, username, email, fullName, accounts }) {
  if (role === "user" && !username) {
    return buildUniqueUsername(email, accounts);
  }

  const candidate = sanitizeUsername(username || fullName || "");

  if (candidate.length < 3) {
    throw validationError("Username must be at least 3 characters.", {
      fields: { username: "Username must be at least 3 characters." },
    });
  }

  if (await accounts.usernameExists(candidate)) {
    const message = "This username is already taken.";

    throw validationError(message, { fields: { username: message } });
  }

  return candidate;
}
