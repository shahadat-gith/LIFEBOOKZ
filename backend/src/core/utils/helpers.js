import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import config from "../config/index.js";

export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: "7d" });
}

/**
 * Sanitize a raw string into a valid account username:
 * lowercase, a-z/0-9/./-/_ only, no leading/trailing separators, max 30 chars.
 */
export function toSlugUsername(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

/** Compare a candidate password against a stored bcrypt hash. */
export function verifyPassword(password, hash) {
  if (!password || !hash) return false;

  return bcrypt.compare(password, hash);
}
