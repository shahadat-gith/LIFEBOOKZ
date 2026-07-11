import jwt from "jsonwebtoken";
import config from "../shared/config/index.js";
import User from "../user/model.js";
import Author from "../author/model.js";
import { AuthenticationError } from "../shared/utils/errors.js";

/**
 * Single authenticate middleware that handles all roles.
 * Token payload must include 'role' field:
 *   - role: 'user'   → token signed with JWT_SECRET, payload has userId, populates req.user
 *   - role: 'author' → token signed with JWT_SECRET, payload has authorId, populates req.author
 *   - role: 'admin'  → token signed with ADMIN_KEY, payload has email, populates req.admin
 */
export async function authenticate(req, _res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.cookies?.author_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);
    if (!token) throw new AuthenticationError("Authentication required");

    // Try JWT_SECRET first (user and author tokens)
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      // If JWT_SECRET fails, try ADMIN_KEY (admin tokens)
      if (
        jwtError.name === "JsonWebTokenError" ||
        jwtError.name === "TokenExpiredError"
      ) {
        try {
          decoded = jwt.verify(token, config.admin.key);
          if (decoded.role !== "admin")
            throw new AuthenticationError("Invalid admin token");
          req.admin = { email: decoded.email };
          return next();
        } catch (adminError) {
          if (adminError instanceof AuthenticationError)
            return next(adminError);
          if (adminError.name === "TokenExpiredError")
            return next(new AuthenticationError("Admin token expired"));
          throw new AuthenticationError("Invalid token");
        }
      }
      if (jwtError.name === "TokenExpiredError")
        return next(new AuthenticationError("Token expired"));
      throw new AuthenticationError("Invalid token");
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
    if (error.name === "JsonWebTokenError")
      return next(new AuthenticationError("Invalid token"));
    next(error);
  }
}

/**
 * Optional auth — same as authenticate but never fails.
 * Populates req.user, req.author, or req.admin if a valid token is present.
 */
export async function authenticateOptional(req, _res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.cookies?.author_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);
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

/**
 * Refresh token verification.
 * Handles both user (role: 'user', type: 'refresh') and author (role: 'author', type: 'refresh').
 */
export async function authenticateRefresh(req, _res, next) {
  try {
    const token =
      req.cookies?.refresh_token ||
      req.cookies?.author_refresh_token ||
      req.body?.refreshToken;
    if (!token) throw new AuthenticationError("Refresh token required");

    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type !== "refresh")
      throw new AuthenticationError("Invalid refresh token");
    if (decoded.role !== "user" && decoded.role !== "author")
      throw new AuthenticationError("Invalid refresh token");

    req.refreshPayload = decoded;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) return next(error);
    if (error.name === "TokenExpiredError")
      return next(new AuthenticationError("Refresh token expired"));
    if (error.name === "JsonWebTokenError")
      return next(new AuthenticationError("Invalid refresh token"));
    next(error);
  }
}
