import { authenticationError, authorizationError } from "@lifebookz/shared-errors";

/**
 * Identity extracted from API Gateway's JWT authorizer.
 *
 * API Gateway validates the RS256 signature, issuer, audience and expiry
 * *before* the Lambda runs, then hands the verified claims to the Lambda in
 * `event.requestContext.authorizer.jwt.claims`. Business services therefore
 * read identity from here and never verify a token themselves — see
 * section "Authentication vs authorization" in the root README.
 */
export const ROLES = Object.freeze({
  READER: "user",
  AUTHOR: "author",
  EXPERT: "expert",
  ADMIN: "admin",
  DEVELOPER: "developer",
});

export const ACCOUNT_ROLES = [ROLES.READER, ROLES.AUTHOR, ROLES.EXPERT];
export const PRIVILEGED_ROLES = [ROLES.ADMIN, ROLES.DEVELOPER];

export function readClaims(event) {
  const raw =
    event?.requestContext?.authorizer?.jwt?.claims ||
    event?.requestContext?.authorizer?.claims || // REST API shape, kept for local tests
    null;

  if (!raw) return null;

  const sub = raw.sub || raw.accountId || raw.userId;

  if (!sub) return null;

  return {
    accountId: String(sub),
    role: raw.role ? String(raw.role) : null,
    email: raw.email ? String(raw.email) : null,
    username: raw.username ? String(raw.username) : null,
    /** Display name, for labelling. Never an authorization input. */
    name: raw.name ? String(raw.name) : null,
    tokenVersion: raw.tokenVersion !== undefined ? Number(raw.tokenVersion) : null,
    issuer: raw.iss || null,
    audience: raw.aud || null,
    expiresAt: raw.exp ? Number(raw.exp) : null,
    jti: raw.jti || null,
    raw,
  };
}

export function requireClaims(claims) {
  if (!claims?.accountId) {
    throw authenticationError("Authentication required.");
  }

  return claims;
}

export function hasRole(claims, roles = []) {
  return Boolean(claims?.role) && roles.includes(claims.role);
}

export function requireRole(claims, roles = []) {
  requireClaims(claims);

  if (!roles.includes(claims.role)) {
    throw authorizationError("You do not have permission to perform this action.");
  }

  return claims;
}

export function requireAccountRole(claims) {
  return requireRole(claims, ACCOUNT_ROLES);
}

export function isAdmin(claims) {
  return claims?.role === ROLES.ADMIN;
}

export function isPrivileged(claims) {
  return PRIVILEGED_ROLES.includes(claims?.role);
}

/**
 * Resource authorization helper: the owner of a document, or an admin.
 *
 * The *decision* stays inside the owning service — API Gateway only answered
 * "who is this?".
 */
export function requireSelfOrAdmin(claims, ownerId, { message = "You do not have permission to perform this action." } = {}) {
  requireClaims(claims);

  if (isAdmin(claims)) return claims;

  if (ownerId && String(ownerId) === String(claims.accountId)) return claims;

  throw authorizationError(message);
}

export function requireSelf(claims, ownerId) {
  requireClaims(claims);

  if (String(ownerId) !== String(claims.accountId)) {
    throw authorizationError("You do not have permission to perform this action.");
  }

  return claims;
}

/** Actor block used when publishing domain events. */
export function actorOf(claims) {
  return claims ? { accountId: claims.accountId, role: claims.role } : null;
}

/** Minimal identity a service may cache in a read model. */
export function identityOf(claims) {
  return claims
    ? { accountId: claims.accountId, role: claims.role, email: claims.email, username: claims.username, name: claims.name }
    : null;
}
