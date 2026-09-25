import { createMongoConnection, resolveSecretWithEnvFallback } from "@lifebookz/shared-aws";

import { config } from "./config.js";

/**
 * Story is the read-heavy service (feed, search, story detail), so its pool is
 * slightly larger than Auth's: 15 connections per container with a **25s**
 * function timeout the throughput is dominated by Mongo round-trips, not
 * credential hashing. `reservedConcurrency: 60` in serverless.yml caps the
 * worst case at 900 sockets, inside an Atlas M10 ceiling (~1500).
 */
let connection;

async function resolveUri() {
  return resolveSecretWithEnvFallback({
    secretId: config.mongoSecretId || undefined,
    valueEnvVar: "MONGODB_STORY_URI",
  });
}

export async function connectDatabase() {
  if (!connection) {
    connection = createMongoConnection({
      uri: await resolveUri(),
      service: "story",
      options: { maxPoolSize: config.mongoMaxPoolSize },
    });
  }

  return connection.connect();
}
