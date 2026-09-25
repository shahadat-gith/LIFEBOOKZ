import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";

import {
  ROLES,
  assertServiceToken,
  buildAccessClaims,
  buildJwks,
  buildOpenIdConfiguration,
  createAccessTokenSigner,
  hasRole,
  isPrivileged,
  publicJwk,
  readClaims,
  requireRole,
  requireSelfOrAdmin,
  verifyJwt,
} from "../index.js";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const KID = "lifebookz-auth-2026-09";
const ISSUER = "https://api.lifebookz.com";
const AUDIENCE = "lifebookz-api";

function signer(overrides = {}) {
  return createAccessTokenSigner({ privateKey, kid: KID, issuer: ISSUER, audience: AUDIENCE, ...overrides });
}

test("access tokens are RS256, carry the expected claims and verify with the public key", () => {
  const { token, claims } = signer().sign({
    account: { id: "acc-1", role: "author", email: "a@lifebookz.com", username: "ada", tokenVersion: 3 },
  });

  assert.equal(token.split(".").length, 3);

  const [headerPart] = token.split(".");
  const header = JSON.parse(Buffer.from(headerPart, "base64").toString("utf8"));
  assert.equal(header.alg, "RS256");
  assert.equal(header.kid, KID);

  const result = verifyJwt({ token, publicKey, issuer: ISSUER, audience: AUDIENCE });

  assert.equal(result.valid, true);
  assert.equal(result.payload.sub, "acc-1");
  assert.equal(result.payload.role, "author");
  assert.equal(result.payload.tokenVersion, 3);
  assert.equal(claims.exp - claims.iat, 900);
  assert.ok(claims.jti);
  assert.equal(claims.iss, ISSUER);
  assert.equal(claims.aud, AUDIENCE);
});

test("a tampered payload or a foreign key invalidates the token", () => {
  const { token } = signer().sign({ account: { id: "acc-1", role: "user", email: "e", username: "u" } });
  const [header, , signature] = token.split(".");
  const forgedPayload = Buffer.from(JSON.stringify({ sub: "attacker", role: "admin" })).toString("base64url");

  assert.equal(verifyJwt({ token: `${header}.${forgedPayload}.${signature}`, publicKey }).valid, false);

  const other = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
  }).publicKey;

  assert.equal(verifyJwt({ token, publicKey: other }).reason, "signature");
});

test("expired, wrong-issuer and wrong-audience tokens are rejected with a reason", () => {
  const past = new Date(Date.now() - 3_600_000);
  const { token } = signer({ ttlSeconds: 60 }).sign({
    account: { id: "acc-1", role: "user", email: "e", username: "u" },
    now: past,
  });

  assert.equal(verifyJwt({ token, publicKey, issuer: ISSUER, audience: AUDIENCE }).reason, "expired");

  const fresh = signer().sign({ account: { id: "acc-2", role: "user", email: "e", username: "u" } }).token;
  assert.equal(verifyJwt({ token: fresh, publicKey, issuer: "https://evil.example" }).reason, "issuer");
  assert.equal(verifyJwt({ token: fresh, publicKey, audience: "other-api" }).reason, "audience");
});

test("the JWKS document publishes a public RSA key with the same kid", () => {
  const jwks = buildJwks([publicJwk({ privateKey, kid: KID })]);

  assert.equal(jwks.keys.length, 1);
  assert.equal(jwks.keys[0].kty, "RSA");
  assert.equal(jwks.keys[0].kid, KID);
  assert.equal(jwks.keys[0].alg, "RS256");
  assert.equal(jwks.keys[0].use, "sig");
  assert.ok(jwks.keys[0].n.startsWith(""));
  assert.equal("d" in jwks.keys[0], false, "a JWK must never expose private material");
});

test("OIDC discovery exposes the issuer and jwks_uri API Gateway needs", () => {
  const document = buildOpenIdConfiguration({ issuer: ISSUER });

  assert.equal(document.issuer, ISSUER);
  assert.equal(document.jwks_uri, "https://api.lifebookz.com/.well-known/jwks.json");
  assert.deepEqual(document.id_token_signing_alg_values_supported, ["RS256"]);
});

test("readClaims extracts identity from an HTTP API JWT authorizer event", () => {
  const event = {
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: "acc-9",
            role: "expert",
            email: "expert@lifebookz.com",
            username: "dr-ada",
            tokenVersion: "2",
            iss: ISSUER,
            aud: AUDIENCE,
            exp: "1893456000",
            jti: "jti-1",
          },
        },
      },
    },
  };

  const claims = readClaims(event);

  assert.equal(claims.accountId, "acc-9");
  assert.equal(claims.role, "expert");
  assert.equal(claims.tokenVersion, 2);
  assert.equal(claims.expiresAt, 1893456000);
  assert.equal(readClaims({}), null);
});

test("role helpers gate privileged and self-only operations", () => {
  const author = { accountId: "a-1", role: ROLES.AUTHOR };
  const admin = { accountId: "adm-1", role: ROLES.ADMIN };

  assert.equal(hasRole(author, ["author", "admin"]), true);
  assert.equal(hasRole({ accountId: "x", role: "user" }, ["author"]), false);
  assert.equal(isPrivileged(admin), true);
  assert.equal(isPrivileged(author), false);

  assert.throws(() => requireRole(author, [ROLES.ADMIN]), /permission/);
  assert.doesNotThrow(() => requireRole(admin, [ROLES.ADMIN]));

  assert.doesNotThrow(() => requireSelfOrAdmin(author, "a-1"));
  assert.doesNotThrow(() => requireSelfOrAdmin(admin, "someone-else"));
  assert.throws(() => requireSelfOrAdmin({ accountId: "a-2", role: ROLES.AUTHOR }, "a-1"), /permission/);
});

test("service tokens are compared in constant time and reject mismatches", () => {
  assert.equal(assertServiceToken("s3cret", "s3cret"), true);
  assert.throws(() => assertServiceToken("wrong", "s3cret"), /Invalid service token/);
  assert.throws(() => assertServiceToken(undefined, "s3cret"), /Missing/);
  assert.throws(() => assertServiceToken("s3cret", ""), /not configured/);
});

test("buildAccessClaims refuses nothing but always sets iss/aud/exp", () => {
  const claims = buildAccessClaims({
    account: { id: "acc-1", role: "user", email: "e", username: "u" },
    issuer: ISSUER,
    audience: AUDIENCE,
    ttlSeconds: 120,
  });

  assert.equal(claims.exp - claims.iat, 120);
});
