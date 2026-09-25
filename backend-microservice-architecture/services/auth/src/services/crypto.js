import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";

/**
 * Password hashing.
 *
 * Called explicitly by the services (never from a Mongoose `save` hook) so a
 * *targeted* `updateOne` — the password-reset path — behaves exactly like the
 * `save()` path. The existing backend hit the reverse problem: reset writes
 * bypassed the hook, which is why its reset had to hash by hand.
 */
export async function hashPassword(password, rounds = 12) {
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password, hash) {
  if (!password || !hash) return false;

  return bcrypt.compare(password, hash);
}

/** Constant-time string comparison for opaque secrets. */
export function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;

  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");

/** 6-digit numeric OTP — the format the existing frontends collect. */
export function generateOtp() {
  return String(randomInt(100000, 1000000));
}

/** 256 bits of entropy for reset and refresh tokens. */
export function generateOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export const sha256Token = sha256;
