import { createMongoConnection, resolveSecretWithEnvFallback } from "@lifebookz/shared-aws";

import { config } from "./config.js";

/**
 * System's own Atlas cluster.
 *
 * System is admin/developer traffic only — a handful of privileged humans —
 * so the pool is deliberately small: `maxPoolSize: 10` with
 * `reservedConcurrency: 10` caps the cluster at ~100 sockets. The cluster is
 * tiny by design; heavy cross-service questions belong in Athena, not here.
 */
let connection;

async function resolveUri() {
  return resolveSecretWithEnvFallback({
    secretId: config.mongoSecretId || undefined,
    valueEnvVar: "MONGODB_SYSTEM_URI",
  });
}

export async function connectDatabase() {
  if (!connection) {
    connection = createMongoConnection({
      uri: await resolveUri(),
      service: "system",
      options: { maxPoolSize: config.mongoMaxPoolSize },
    });
  }

  return connection.connect();
}
