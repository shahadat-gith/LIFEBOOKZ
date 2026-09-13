import jwt from "jsonwebtoken";
import config from "../config/index.js";

import User from "../../modules/user/model.js";
import Author from "../../modules/author/model.js";
import Expert from "../../modules/expert/model.js";

import {
  AuthenticationError,
  AuthorizationError,
} from "../utils/errors.js";

/**
 * Token roles that map to an account document, plus the JWT claim carrying
 * its id. One table drives every lookup so a token can never resolve to the
 * wrong account type.
 */
const ACCOUNT_ROLES = {
  user: { model: User, claim: "userId", label: "User" },
  author: { model: Author, claim: "authorId", label: "Author" },
  expert: { model: Expert, claim: "expertId", label: "Expert" },
};

/**
 * Extract token from the Authorization header.
 */
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    // Covers malformed, tampered with and expired tokens alike.
    throw new AuthenticationError("Invalid or expired token.");
  }
}

/**
 * Load the account behind a token and reject it when the account is gone or
 * no longer usable.
 */
async function loadAccount(role, decoded) {
  const { model, claim, label } = ACCOUNT_ROLES[role];
  const id = decoded[claim];

  if (!id) {
    throw new AuthenticationError("Invalid token.");
  }

  const account = await model.findById(id).select("-auth.passwordHash");

  if (!account) {
    throw new AuthenticationError(`${label} account no longer exists.`);
  }

  // Accounts created before the `status` field existed are treated as active.
  if (account.status && account.status !== "active") {
    throw new AuthenticationError(
      "This account is not active. Please contact support.",
    );
  }

  return account;
}

/**
 * Authentication — verifies the bearer token, then attaches the caller's
 * account to `req.user` and its role to `req.role`.
 *
 * Layering rule for every route:
 *   authenticate     → who are you?      (valid token, existing account)
 *   authorize(...)   → are you allowed?  (role gate, must come after)
 *   requireApproved  → are you verified? (author/expert application state)
 *
 * Verification status is deliberately NOT checked here: a pending author or
 * expert still has to read their own profile and application state. Routes
 * that must only serve approved accounts add `requireApproved`.
 */
export async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError("Authentication required.");
    }

    const decoded = verifyToken(token);

    req.role = decoded.role;

    switch (decoded.role) {
      case "admin": {
        if (!config.admin.key || decoded.key !== config.admin.key) {
          throw new AuthenticationError("Invalid admin token.");
        }

        req.admin = true;

        return next();
      }

      case "developer": {
        if (!config.developer.email || !config.developer.password) {
          throw new AuthenticationError(
            "Developer access is not configured on this server.",
          );
        }

        req.developer = true;

        return next();
      }

      case "user":
      case "author":
      case "expert": {
        req.user = await loadAccount(decoded.role, decoded);

        return next();
      }

      default:
        throw new AuthenticationError("Invalid token.");
    }
  } catch (error) {
    return next(error);
  }
}

/**
 * Optional authentication — like `authenticate`, but guests are allowed
 * through. Attaches `req.user`/`req.role` when a valid token is present so
 * responses can include personalized state (likes, follows); otherwise the
 * request continues anonymously. Never throws for missing/invalid tokens.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);

    if (!token) return next();

    const decoded = verifyToken(token);

    req.role = decoded.role;

    switch (decoded.role) {
      case "user":
      case "author":
      case "expert": {
        req.user = await loadAccount(decoded.role, decoded);
        return next();
      }
      default:
        // Admin/developer tokens are not meaningful for public reads —
        // treat the caller as anonymous rather than failing the request.
        req.role = undefined;
        return next();
    }
  } catch {
    // Invalid/expired token on a public route: continue as anonymous.
    req.user = undefined;
    req.role = undefined;
    return next();
  }
}

/**
 * Role gate. Must run after `authenticate`, which sets `req.role`.
 * Rejects anyone whose role isn't in the allowed list with a 403.
 *
 * Usage: router.get("/logs", authenticate, authorize("developer"), handler)
 */
export function authorize(...roles) {
  return function authorizeRole(req, _res, next) {
    if (!req.role || !roles.includes(req.role)) {
      return next(
        new AuthorizationError(
          "You do not have permission to perform this action.",
        ),
      );
    }

    return next();
  };
}

/**
 * Application gate for self-service roles. Authors and experts can sign in
 * and manage their own data while pending, but only approved accounts may
 * publish or take consultations.
 */
export function requireApproved(req, _res, next) {
  const status = req.user?.verification?.status;

  if (status === "approved") {
    return next();
  }

  if (status === "rejected") {
    return next(
      new AuthorizationError(
        "Your application was not approved, so this action is unavailable.",
      ),
    );
  }

  return next(
    new AuthorizationError(
      "Your account is still awaiting approval. You can continue this once an admin reviews your application.",
    ),
  );
}

/**
 * Publishing gate for authors: the profile must be completed (profession,
 * bio, phone, DOB, gender) before a story can be published.
 */
export function requireProfileComplete(req, _res, next) {
  if (req.user?.isProfileCompleted) {
    return next();
  }

  return next(
    new AuthorizationError(
      "Please complete your profile before publishing. Fill in your profession, bio, phone, date of birth, and gender to continue.",
    ),
  );
}
