import { loadConfig } from "@lifebookz/shared-aws";

/**
 * System service configuration.
 *
 * System owns no user data of its own beyond read models; its config is the
 * platform plumbing (bus, queues, log group, service token to call Auth) plus
 * its own Atlas cluster.
 */
export const config = loadConfig({
  service: "system",
  required: {
    eventBusName: "EVENT_BUS_NAME",
  },
  optional: {
    mongoSecretId: ["MONGODB_SYSTEM_URI_SECRET_ID", ""],
    mongoUri: ["MONGODB_SYSTEM_URI", ""],
    // Internal service token for calling Auth's verification endpoint.
    internalServiceTokenSecretId: ["INTERNAL_SERVICE_TOKEN_SECRET_ID", ""],
    internalServiceToken: ["INTERNAL_SERVICE_TOKEN", ""],
    authApiBaseUrl: ["AUTH_API_BASE_URL", ""],
    logGroupName: ["DEVELOPER_LOG_GROUP", ""],
    logRegion: ["AWS_REGION", "ap-south-1"],
  },
  numbers: {
    mongoMaxPoolSize: { variable: "MONGO_MAX_POOL_SIZE", fallback: 10, min: 1, max: 50 },
    adminListLimit: { variable: "ADMIN_LIST_LIMIT", fallback: 100, min: 10, max: 500 },
  },
});
