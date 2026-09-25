import { resolveSecretWithEnvFallback } from "@lifebookz/shared-aws";
import { createPublisher } from "@lifebookz/shared-events";

import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { createAuditLogRepository } from "./repositories/audit-logs.js";
import { createReviewQueueRepository } from "./repositories/review-queue.js";
import { createAdminService, createAuthClient } from "./services/admin.js";
import { createCloudWatchLogs, createDeveloperService } from "./services/developer.js";

/**
 * Dependency container — one instance per Lambda container (module scope);
 * the Mongo connection and clients are cached inside their modules.
 */
export function createContainer({ logger }) {
  const publisher = createPublisher({ busName: config.eventBusName, service: "system", logger });

  const reviewQueue = createReviewQueueRepository();
  const auditLogs = createAuditLogRepository();

  const authClient = createAuthClient({
    baseUrl: config.authApiBaseUrl,
    token: config.internalServiceToken,
    logger,
  });

  const cloudWatch = createCloudWatchLogs({ logGroupName: config.logGroupName, region: config.logRegion });

  const adminIdentity = () => ({ email: "admin@lifebookz.com", role: "admin" });

  const deps = {
    config,
    logger,
    publisher,
    reviewQueue,
    auditLogs,
    authClient,

    admin: createAdminService({ reviewQueue, auditLogs, publisher, authClient, adminIdentity, logger }),
    developer: createDeveloperService({ auditLogs, cloudWatch, adminIdentity, logger }),

    eventHandlers: null, // wired below (circular-free)

    async ready() {
      await connectDatabase();
      return true;
    },

    getServiceToken() {
      return resolveSecretWithEnvFallback({
        secretId: config.internalServiceTokenSecretId || undefined,
        valueEnvVar: "INTERNAL_SERVICE_TOKEN",
      });
    },
  };

  return deps;
}

let cached;

/** Memoised deps for the Lambda container. */
export function getDeps({ logger } = {}) {
  if (!cached) cached = createContainer({ logger });

  return cached;
}

export function resetContainer() {
  cached = undefined;
}
