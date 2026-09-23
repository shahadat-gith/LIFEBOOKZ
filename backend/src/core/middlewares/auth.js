import jwt from "jsonwebtoken";
import config from "../config/index.js";

import User from "../../modules/user/model.js";
import Author from "../../modules/author/model.js";
import Expert from "../../modules/expert/model.js";

import { authenticationError, authorizationError } from "../utils/errors.js";

/**
 * One table drives every token lookup, so a token can never resolve to the
 * wrong account type.
 */
const ACCOUNT_ROLES = {
  user: { model: User, claim: "userId", label: "User" },
  author: { model: Author, claim: "authorId", label: "Author" },
  expert: { model: Expert, claim: "expertId", label: "Expert" },
};

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
    throw authenticationError("Invalid or expired token.");
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
    throw authenticationError("Invalid token.");
  }

  const account = await model.findById(id).select("-auth.passwordHash");

  if (!account) {
    throw authenticationError(`${label} account no longer exists.`);
  }

  // Accounts created before the `status` field existed are treated as active.
  if (account.status && account.status !== "active") {
    throw authenticationError(
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
      throw authenticationError("Authentication required.");
    }

    const decoded = verifyToken(token);

    req.role = decoded.role;

    switch (decoded.role) {
      case "admin": {
        if (!config.admin.key || decoded.key !== config.admin.key) {
          throw authenticationError("Invalid admin token.");
        }

        req.admin = true;

        return next();
      }

      case "developer": {
        if (!config.developer.email || !config.developer.password) {
          throw authenticationError(
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
        throw authenticationError("Invalid token.");
    }
  } catch (error) {
    return next(error);
  }
}

/**
 * Optional authentication for public read routes.
 *
 * Reading a story is public, but a signed-in caller must still be
 * personalised: did I already like this story, do I follow this author, have
 * I liked this comment. A missing, expired or invalid token is not an error
 * here — the request simply continues as an anonymous reader.
 */
export async function optionalAuthenticate(req, _res, next) {
  const token = extractToken(req);

  if (!token) return next();

  try {
    const decoded = verifyToken(token);

    if (ACCOUNT_ROLES[decoded.role]) {
      req.user = await loadAccount(decoded.role, decoded);
      req.role = decoded.role;
    }
  } catch {
    // Treated as an anonymous reader.
  }

  return next();
}

/**
 * Role gate. Must run after `authenticate`, which sets `req.role`.
 * Rejects anyone whose role isn't in the allowed list with a 403.
 */
export function authorize(...roles) {
  return function authorizeRole(req, _res, next) {
    if (!req.role || !roles.includes(req.role)) {
      return next(
        authorizationError("You do not have permission to perform this action."),
      );
    }

    return next();
  };
}

/**
 * Publishing gate for authors: the profile must be completed (profession,
 * bio, phone, DOB, gender) before a story can be published. Writing, media
 * uploads and drafts are available without completing the profile.
 */
export function requireProfileComplete(req, _res, next) {
  if (req.user?.isProfileCompleted) {
    return next();
  }

  return next(
    authorizationError(
      "Please complete your profile before publishing. Fill in your profession, bio, phone, date of birth, and gender to continue.",
    ),
  );
}
