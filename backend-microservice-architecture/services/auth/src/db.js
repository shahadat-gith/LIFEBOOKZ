import { createMongoConnection, resolveSecretWithEnvFallback } from "@lifebookz/shared-aws";

import { config } from "./config.js";

/**
 * One connection per Lambda container, opened lazily on the first invocation
 * that needs the database.
 *
 * Pool sizing (auth): OTP and login bursts are short and sharp, and this
 * service must not be starved by traffic on another cluster, which is exactly
 * why Auth has its own Atlas cluster. `maxPoolSize: 10` per container is
 * enough for the write-per-request work here; with Atlas M10 (a 1500
 * connection ceiling) that supports ~150 concurrent containers, well above the
 * reserved concurrency this function is configured with.
 */
let connection;

async function resolveUri() {
  return resolveSecretWithEnvFallback({
    secretId: config.mongoSecretId || undefined,
    valueEnvVar: "MONGODB_AUTH_URI",
  });
}

export async function connectDatabase() {
  if (!connection) {
    connection = createMongoConnection({
      uri: await resolveUri(),
      service: "auth",
      options: { maxPoolSize: config.mongoMaxPoolSize },
    });
  }

  return connection.connect();
}

export const mongo = () => connection;
