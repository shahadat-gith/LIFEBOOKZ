import jwt from "jsonwebtoken";
import config from "../config/index.js";

import User from "../../user/model.js";
import Author from "../../author/model.js";

import { AuthenticationError } from "../utils/errors.js";

/**
 * Extract token from Authorization header or cookie.
 */
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

/**
 * Strict auth — blocks unapproved authors.
 * Use for routes that require a fully verified author.
 */
export async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError("Authentication required.");
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    req.role = decoded.role;

    switch (decoded.role) {
      case "admin": {
        if (decoded.key !== config.admin.key) {
          throw new AuthenticationError("Invalid admin token.");
        }

        req.admin = true;

        return next();
      }

      case "user": {
        const user = await User.findById(decoded.userId).select(
          "-passwordHash",
        );

        if (!user) {
          throw new AuthenticationError("User not found.");
        }

        req.user = user;

        return next();
      }

      case "author": {
        const author = await Author.findById(decoded.authorId).select(
          "-passwordHash",
        );

        if (!author) {
          throw new AuthenticationError("Author not found.");
        }

        if (author.verification.status !== "approved") {
          throw new AuthenticationError("Your author account is not approved.");
        }

        req.user = author;

        return next();
      }

      default:
        throw new AuthenticationError("Invalid token.");
    }
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return next(new AuthenticationError("Invalid or expired token."));
    }

    return next(error);
  }
}

/**
 * Soft auth — validates token and populates req.user/req.admin
 * without blocking unapproved authors. Use for self-service routes
 * where the user just needs to be identified (e.g. fetching own profile).
 */
export async function authenticateSoft(req, _res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError("Authentication required.");
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    req.role = decoded.role;

    switch (decoded.role) {
      case "admin": {
        if (decoded.key !== config.admin.key) {
          throw new AuthenticationError("Invalid admin token.");
        }

        req.admin = true;

        return next();
      }

      case "user": {
        const user = await User.findById(decoded.userId).select(
          "-passwordHash",
        );

        if (!user) {
          throw new AuthenticationError("User not found.");
        }

        req.user = user;

        return next();
      }

      case "author": {
        const author = await Author.findById(decoded.authorId).select(
          "-passwordHash",
        );

        if (!author) {
          throw new AuthenticationError("Author not found.");
        }

        // Soft auth does NOT check verification status
        // so pending authors can access their own data
        req.user = author;

        return next();
      }

      default:
        throw new AuthenticationError("Invalid token.");
    }
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return next(new AuthenticationError("Invalid or expired token."));
    }

    return next(error);
  }
}
