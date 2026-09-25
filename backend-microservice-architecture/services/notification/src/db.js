import { createMongoConnection, resolveSecretWithEnvFallback } from "@lifebookz/shared-aws";

import { config } from "./config.js";

/**
 * Notification's own Atlas cluster.
 *
 * The service is almost entirely write-on-demand (an event arrives, one row is
 * inserted) with a small read path (the bell dropdown polls `unread-count`), so
 * the pool is deliberately small: `maxPoolSize: 10` with a burst-friendly
 * `reservedConcurrency: 20` caps the cluster at ~200 sockets.
 */
let connection;

async function resolveUri() {
  return resolveSecretWithEnvFallback({
    secretId: config.mongoSecretId || undefined,
    valueEnvVar: "MONGODB_NOTIFICATION_URI",
  });
}

export async function connectDatabase() {
  if (!connection) {
    connection = createMongoConnection({
      uri: await resolveUri(),
      service: "notification",
      options: { maxPoolSize: config.mongoMaxPoolSize },
    });
  }

  return connection.connect();
}
