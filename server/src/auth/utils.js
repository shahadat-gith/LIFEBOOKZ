import jwt from 'jsonwebtoken';
import config from '../shared/config/index.js';

/**
 * Generate a token with no expiry for the given payload.
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret);
}

// ---- User Tokens ----

export function generateAccessToken(user) {
  return generateToken({
    role: 'user',
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  });
}

export function sanitizeUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
}

// ---- Author Tokens ----

export function generateAuthorAccessToken(author) {
  return generateToken({
    role: 'author',
    authorId: author._id.toString(),
    email: author.email,
  });
}

// ---- Admin Tokens ----

export function generateAdminToken() {
  return jwt.sign(
    { role: 'admin', email: config.admin.email },
    config.admin.key
  );
}
