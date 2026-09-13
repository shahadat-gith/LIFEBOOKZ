import jwt from "jsonwebtoken";
import { v5 as uuidv5 } from "uuid";
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

const QDRANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export function toQdrantUuid(mongoId) {
  return uuidv5(mongoId.toString(), QDRANT_NAMESPACE);
}
