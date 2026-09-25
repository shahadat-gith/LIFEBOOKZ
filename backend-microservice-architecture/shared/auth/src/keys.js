import { randomUUID, sign as cryptoSign, createPublicKey, verify as cryptoVerify } from "node:crypto";

/**
 * RS256 JWT signing and key publication.
 *
 * Why RS256 instead of the monolith's HS256 shared secret: API Gateway's
 * native HTTP API JWT authorizer validates tokens itself using the issuer's
 * JWKS. That is only possible with an asymmetric key — the gateway holds the
 * public key, so no business Lambda ever receives signing material and no
 * shared secret has to be copied into every service.
 */

function base64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);

  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(input) {
  return Buffer.from(String(input).replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Build the access-token claims.
 *
 * Kept intentionally small: everything a business service needs for
 * *authentication* (who is calling) and *coarse role gating*. Resource
 * ownership and fine-grained permissions stay in the owning service, because
 * they can change without re-issuing a token.
 */
export function buildAccessClaims({ account, issuer, audience, ttlSeconds = 900, extra = {}, now = new Date() }) {
  const issuedAt = Math.floor(now.getTime() / 1000);

  return {
    iss: issuer,
    aud: audience,
    sub: String(account.id || account._id),
    role: account.role,
    email: account.email,
    username: account.username,
    // Display name only. Carried in the token so a business service can label
    // an actor ("Priya requested a session") without a projection of, or a
    // synchronous call into, the Auth cluster. Never used for authorization.
    name: account.fullName || account.name || account.username,
    // Bumped on password change / forced logout so a token can be rejected at
    // refresh time even though it has not expired yet.
    tokenVersion: account.tokenVersion ?? 0,
    jti: randomUUID(),
    iat: issuedAt,
    exp: issuedAt + Number(ttlSeconds),
    ...extra,
  };
}

/**
 * Sign a JWT with the RS256 private key.
 *
 * Implemented on `node:crypto` directly so the shared package keeps zero
 * runtime dependencies; the algorithm and key id are explicit (a `kid` that
 * matches the JWKS entry is what makes rotation possible).
 */
export function signJwt({ claims, privateKey, kid, algorithm = "RS256" }) {
  if (!privateKey) throw new Error("signJwt requires a private key");
  if (!claims?.iss || !claims?.aud || !claims?.exp) {
    throw new Error("signJwt requires claims with iss, aud and exp");
  }

  const header = { alg: algorithm, typ: "JWT", ...(kid ? { kid } : {}) };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  const signature = cryptoSign("RSA-SHA256", Buffer.from(signingInput), privateKey);

  return `${signingInput}.${base64Url(signature)}`;
}

/** Create the token signer bound to one key configuration. */
export function createAccessTokenSigner({ privateKey, kid, issuer, audience, ttlSeconds = 900 }) {
  return {
    kid,
    issuer,
    audience,
    ttlSeconds,
    sign({ account, extra, now }) {
      const claims = buildAccessClaims({ account, issuer, audience, ttlSeconds, extra, now });

      return { token: signJwt({ claims, privateKey, kid }), claims };
    },
  };
}

/**
 * Verify a token with a public key.
 *
 * Used by the auth service itself (refresh path) and by tests. Business
 * services deliberately do NOT do this: API Gateway already did, and a second
 * verification would mean shipping the public key (or a network hop) into
 * every Lambda for no security gain.
 */
export function verifyJwt({ token, publicKey, issuer, audience, clockToleranceSeconds = 0 }) {
  const [headerPart, payloadPart, signaturePart] = String(token).split(".");

  if (!headerPart || !payloadPart || !signaturePart) {
    return { valid: false, reason: "malformed" };
  }

  const header = JSON.parse(decodeBase64Url(headerPart).toString("utf8"));
  const payload = JSON.parse(decodeBase64Url(payloadPart).toString("utf8"));

  const valid = cryptoVerify(
    "RSA-SHA256",
    Buffer.from(`${headerPart}.${payloadPart}`),
    publicKey,
    decodeBase64Url(signaturePart),
  );

  if (!valid) return { valid: false, reason: "signature", header, payload };

  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp + clockToleranceSeconds < now) {
    return { valid: false, reason: "expired", header, payload };
  }
  if (issuer && payload.iss !== issuer) return { valid: false, reason: "issuer", header, payload };
  if (audience && payload.aud !== audience) return { valid: false, reason: "audience", header, payload };

  return { valid: true, header, payload };
}

/** Public JWK for the JWKS endpoint (`{alg, use, kid}` included on purpose). */
export function publicJwk({ privateKey, publicKey, kid, algorithm = "RS256" }) {
  const key = publicKey || createPublicKey(privateKey);
  const jwk = key.export({ format: "jwk" });

  return { ...jwk, kid, alg: algorithm, use: "sig", key_ops: ["verify"] };
}

/** JWKS document served at the issuer's `jwks_uri`. */
export function buildJwks(keys = []) {
  return { keys: keys.filter(Boolean) };
}

/**
 * OIDC discovery document.
 *
 * API Gateway's JWT authorizer requires it: it fetches
 * `<issuer>/.well-known/openid-configuration` and reads `jwks_uri` from there.
 * Serving the document at the API's root is what makes an API-Gateway-native
 * authorizer possible without Cognito/Auth0.
 */
export function buildOpenIdConfiguration({ issuer, jwksPath = "/.well-known/jwks.json", authorizationEndpoint, tokenEndpoint } = {}) {
  if (!issuer) throw new Error("buildOpenIdConfiguration requires an issuer");

  return {
    issuer,
    jwks_uri: `${issuer.replace(/\/$/, "")}${jwksPath}`,
    id_token_signing_alg_values_supported: ["RS256"],
    subject_types_supported: ["public"],
    response_types_supported: ["id_token", "token"],
    claims_supported: ["sub", "iss", "aud", "exp", "iat", "jti", "role", "email", "username"],
    ...(authorizationEndpoint ? { authorization_endpoint: authorizationEndpoint } : {}),
    ...(tokenEndpoint ? { token_endpoint: tokenEndpoint } : {}),
  };
}

export { base64Url, decodeBase64Url };
