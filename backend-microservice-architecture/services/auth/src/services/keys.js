import { createPublicKey } from "node:crypto";

import { loadSecretJson } from "@lifebookz/shared-aws";
import { buildJwks, buildOpenIdConfiguration, createAccessTokenSigner, publicJwk } from "@lifebookz/shared-auth";
import { serviceUnavailableError } from "@lifebookz/shared-errors";

import { config } from "../config.js";

/**
 * The signing key provider — the single most sensitive piece of the
 * architecture.
 *
 * Production: the RSA private key lives in AWS Secrets Manager
 * (`JWT_PRIVATE_KEY_SECRET_ID`) as JSON `{ "privateKey": "-----BEGIN…" }`.
 * Local development: `JWT_PRIVATE_KEY` in .env (never committed).
 *
 * Business services never see this: they only read the claims API Gateway has
 * already validated. Only the public key is published, through
 * `/.well-known/jwks.json` (consumed by the API Gateway authorizer) and
 * `/.well-known/openid-configuration` (the discovery document API Gateway
 * fetches to find the JWKS).
 */
export function createKeyProvider({ secretLoader = loadSecretJson, cfg = config } = {}) {
  let cache;

  async function loadPrivateKey() {
    if (cfg.jwtPrivateKey) return cfg.jwtPrivateKey;

    if (!cfg.jwtPrivateKeySecretId) {
      throw serviceUnavailableError(
        "JWT signing key is not configured (set JWT_PRIVATE_KEY_SECRET_ID or JWT_PRIVATE_KEY).",
      );
    }

    const secret = await secretLoader(cfg.jwtPrivateKeySecretId);

    if (!secret?.privateKey) {
      throw serviceUnavailableError(
        `Secret "${cfg.jwtPrivateKeySecretId}" must contain a JSON "privateKey" field.`,
      );
    }

    return secret.privateKey;
  }

  async function load() {
    if (cache) return cache;

    const privateKey = await loadPrivateKey();
    const publicKey = cfg.jwtPublicKey || createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();

    const signer = createAccessTokenSigner({
      privateKey,
      kid: cfg.kid,
      issuer: cfg.issuer,
      audience: cfg.audience,
      ttlSeconds: cfg.accessTokenTtlSeconds,
    });

    const keys = [publicJwk({ privateKey, kid: cfg.kid })];

    // A retired key stays published until every token signed with it has
    // expired, otherwise refresh-time verification and in-flight access tokens
    // break during a rotation.
    if (cfg.previousPublicKey && cfg.previousKid) {
      keys.push(publicJwk({ publicKey: cfg.previousPublicKey, kid: cfg.previousKid }));
    }

    cache = {
      signer,
      publicKey,
      kid: cfg.kid,
      issuer: cfg.issuer,
      audience: cfg.audience,
      jwks: buildJwks(keys),
      /**
       * Key rotation runbook (also in the README):
       * 1. add the new pair to Secrets Manager and set JWT_KID to the new id;
       * 2. deploy — the JWKS now publishes new + previous keys;
       * 3. old tokens keep verifying until the last refresh token expires;
       * 4. drop JWT_PREVIOUS_PUBLIC_KEY once access-token TTL + refresh window
       *    has passed.
       */
      rotation: { currentKid: cfg.kid, previousKid: cfg.previousKid || null },
    };

    return cache;
  }

  return {
    load,
    /** Discoverable through the OIDC document API Gateway fetches. */
    async openIdConfiguration() {
      const { issuer } = await load();

      return buildOpenIdConfiguration({ issuer, jwksPath: "/.well-known/jwks.json" });
    },
    async jwks() {
      return (await load()).jwks;
    },
    async issue({ account, extra, now }) {
      return (await load()).signer.sign({ account, extra, now });
    },
  };
}
