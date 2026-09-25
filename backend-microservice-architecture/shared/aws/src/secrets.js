import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

import { requireEnv } from "./config.js";
import { getSecretsManagerClient } from "./clients.js";

/**
 * Secrets are read from AWS Secrets Manager and cached for the lifetime of the
 * Lambda container. Nothing sensitive is ever placed in `provider.environment`
 * (which is visible in the Lambda console and in CloudFormation).
 *
 * Only the *name/id* of a secret is configuration; the value never is.
 */
const cache = new Map();

function readSecretValue(client, secretId) {
  return client.send(new GetSecretValueCommand({ SecretId: secretId })).then((response) => {
    if (response.SecretString) return response.SecretString;
    if (response.SecretBinary) return Buffer.from(response.SecretBinary).toString("utf8");

    throw new Error(`Secret "${secretId}" has no value.`);
  });
}

export async function loadSecretString(secretId, { client, region } = {}) {
  if (!secretId) throw new Error("loadSecretString requires a secret id");

  // An injected client (tests) bypasses the container cache entirely.
  if (client) return readSecretValue(client, secretId);

  if (cache.has(secretId)) return cache.get(secretId);

  const promise = readSecretValue(getSecretsManagerClient({ region }), secretId).catch((error) => {
    // A failed lookup must not be cached: the next invocation should retry.
    cache.delete(secretId);
    throw error;
  });

  cache.set(secretId, promise);

  return promise;
}

/** Read a JSON secret. Shape errors are surfaced immediately (fail fast). */
export async function loadSecretJson(secretId, { client, region } = {}) {
  const raw = await loadSecretString(secretId, { client, region });
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;

  if (!value || typeof value !== "object") {
    throw new Error(`Secret "${secretId}" must contain a JSON object.`);
  }

  return value;
}

/**
 * Configuration that must not live in plain environment variables in
 * production, but has to stay easy to run locally.
 *
 * - production: name the secret id in an env var (e.g. MONGODB_STORY_URI_SECRET_ID)
 * - local dev:  put the value in .env (e.g. MONGODB_STORY_URI)
 *
 * The secret wins when both exist so a stray local value cannot override a
 * deployed secret.
 */
export async function resolveSecretWithEnvFallback({ secretIdEnvVar, valueEnvVar, secretId, defaultValue, client, region } = {}) {
  const id = secretId || (secretIdEnvVar ? process.env[secretIdEnvVar] : undefined);

  if (id) {
    try {
      return await loadSecretString(id, { client, region });
    } catch (error) {
      const fallback = valueEnvVar ? process.env[valueEnvVar] : undefined;

      if (fallback && process.env.NODE_ENV !== "production") {
        return fallback;
      }

      throw new Error(
        `Could not read secret "${id}" (${error.message}).` +
          (fallback ? "" : ` Set ${valueEnvVar} for local development.`),
      );
    }
  }

  const value = valueEnvVar ? process.env[valueEnvVar] : undefined;
  if (value) return value;
  if (defaultValue !== undefined) return defaultValue;

  throw new Error(
    `Missing secret: set ${secretIdEnvVar} (production) or ${valueEnvVar} (local development).`,
  );
}

/** Convenience for the common "one secret id, resolved lazily" pattern. */
export function requiredSecretId(envVar, { service } = {}) {
  return requireEnv(envVar, { service });
}

export function resetSecretCache() {
  cache.clear();
}
