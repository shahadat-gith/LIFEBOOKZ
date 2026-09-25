import { createMongoConnection, resolveSecretWithEnvFallback } from "@lifebookz/shared-aws";

import { config } from "./config.js";

/**
 * Consultation is bursty (a booking writes, an expert dashboard polls) but low
 * volume compared with Story, so the pool is intentionally smaller:
 * `maxPoolSize: 10` with `reservedConcurrency: 40` caps the cluster at 400
 * sockets — well inside Atlas M10 and far below the Story service's ceiling,
 * which is the point of giving each service its own cluster.
 */
let connection;

async function resolveUri() {
  return resolveSecretWithEnvFallback({
    secretId: config.mongoSecretId || undefined,
    valueEnvVar: "MONGODB_CONSULTATION_URI",
  });
}

export async function connectDatabase() {
  if (!connection) {
    connection = createMongoConnection({
      uri: await resolveUri(),
      service: "consultation",
      options: { maxPoolSize: config.mongoMaxPoolSize },
    });
  }

  return connection.connect();
}
