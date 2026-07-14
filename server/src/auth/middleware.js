import jwt from "jsonwebtoken";
import config from "../shared/config/index.js";
import User from "../user/model.js";
import Author from "../author/model.js";
import { AuthenticationError } from "../shared/utils/errors.js";

/**
 * Extract Bearer token from Authorization header.
 */
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

/**
 * Single authenticate middleware that handles all roles.
 * Token payload must include 'role' field:
 *   - role: 'user'   → token signed with JWT_SECRET, payload has userId, populates req.user
 *   - role: 'author' → token signed with JWT_SECRET, payload has authorId, populates req.author
 *   - role: 'admin'  → token signed with ADMIN_KEY, payload has email, populates req.admin
 */
export async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new AuthenticationError("Authentication required");

    // Try JWT_SECRET first (user and author tokens)
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch {
      // If JWT_SECRET fails, try ADMIN_KEY (admin tokens)
      try {
        decoded = jwt.verify(token, config.admin.key);
        if (decoded.role !== "admin")
          throw new AuthenticationError("Invalid admin token");
        req.admin = { email: decoded.email };
        return next();
      } catch {
        throw new AuthenticationError("Invalid token");
      }
    }

    // Handle based on role
    if (decoded.role === "user") {
      const user = await User.findById(decoded.userId).select("-passwordHash");
      if (!user) throw new AuthenticationError("User not found");
      req.user = user;
      return next();
    }

    if (decoded.role === "author") {
      const author = await Author.findById(decoded.authorId).select(
        "-passwordHash",
      );
      if (!author || author.verification?.status !== "approved")
        throw new AuthenticationError("Author not found or not yet approved");
      req.author = author;
      return next();
    }

    throw new AuthenticationError("Invalid token role");
  } catch (error) {
    if (error instanceof AuthenticationError) return next(error);
    next(error);
  }
}

/**
 * Optional auth — same as authenticate but never fails.
 * Populates req.user, req.author, or req.admin if a valid token is present.
 */
export async function authenticateOptional(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch {
      try {
        decoded = jwt.verify(token, config.admin.key);
        if (decoded.role === "admin") req.admin = { email: decoded.email };
      } catch {
        /* ignore */
      }
      return next();
    }

    if (decoded.role === "user") {
      const user = await User.findById(decoded.userId).select("-passwordHash");
      if (user) req.user = user;
    } else if (decoded.role === "author") {
      const author = await Author.findById(decoded.authorId).select(
        "-passwordHash",
      );
      if (author) req.author = author;
    }
  } catch {
    /* ignore */
  }
  next();
}
