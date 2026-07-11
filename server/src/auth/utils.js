import jwt from 'jsonwebtoken';
import config from '../shared/config/index.js';

// ---- User Tokens ----

export function generateAccessToken(user) {
  return jwt.sign(
    { role: 'user', userId: user._id.toString(), email: user.email, name: user.name, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { role: 'user', userId: user._id.toString(), type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiry }
  );
}

export function refreshAccessToken(refreshPayload) {
  return jwt.sign(
    { role: 'user', userId: refreshPayload.userId, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
}

export function generateToken(user) {
  return generateAccessToken(user);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.__v;
  delete obj.googleId;
  return obj;
}

// ---- Author Tokens ----

export function generateAuthorAccessToken(author) {
  return jwt.sign(
    { role: 'author', authorId: author._id.toString(), email: author.email, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
}

export function generateAuthorRefreshToken(author) {
  return jwt.sign(
    { role: 'author', authorId: author._id.toString(), type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiry }
  );
}

export function refreshAuthorAccessToken(refreshPayload) {
  return jwt.sign(
    { role: 'author', authorId: refreshPayload.authorId, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
}
