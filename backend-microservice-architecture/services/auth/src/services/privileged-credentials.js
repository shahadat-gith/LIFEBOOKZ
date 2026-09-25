import { loadSecretJson } from "@lifebookz/shared-aws";

/**
 * Admin / developer credentials.
 *
 * They live in Secrets Manager, not in a MongoDB collection, so a leaked
 * database cannot be turned into an admin session. Local development falls back
 * to `ADMIN_EMAIL`/`ADMIN_PASSWORD` (and the developer pair) in `.env`.
 *
 * Returning `{}` for an unconfigured role keeps the existing behaviour: the
 * developer portal is effectively disabled until its credentials are set, and
 * login answers 503 instead of 500.
 */
export function createPrivilegedCredentialsProvider({ cfg, secretLoader = loadSecretJson, env = process.env, logger } = {}) {
  const definitions = {
    admin: { secretId: cfg?.adminCredentialsSecretId, emailVar: "ADMIN_EMAIL", passwordVar: "ADMIN_PASSWORD" },
    developer: {
      secretId: cfg?.developerCredentialsSecretId,
      emailVar: "DEVELOPER_EMAIL",
      passwordVar: "DEVELOPER_PASSWORD",
    },
  };

  const cache = new Map();

  return {
    async get(role) {
      const definition = definitions[role];

      if (!definition) return {};

      if (cache.has(role)) return cache.get(role);

      let credentials = {};

      if (definition.secretId) {
        try {
          const secret = await secretLoader(definition.secretId);
          credentials = { email: secret.email, password: secret.password };
        } catch (error) {
          logger?.warn?.("Could not read privileged credentials from Secrets Manager", {
            role,
            secretId: definition.secretId,
            error: error.message,
          });
        }
      }

      if (!credentials.email || !credentials.password) {
        credentials = {
          email: env[definition.emailVar],
          password: env[definition.passwordVar],
        };
      }

      cache.set(role, credentials);

      return credentials;
    },
  };
}
