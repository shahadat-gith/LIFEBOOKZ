import { loadConfig } from "@lifebookz/shared-aws";

export const config = loadConfig({
  service: "consultation",
  required: {
    eventBusName: "EVENT_BUS_NAME",
  },
  optional: {
    mongoSecretId: ["MONGODB_CONSULTATION_URI_SECRET_ID", ""],
    mongoUri: ["MONGODB_CONSULTATION_URI", ""],
    r2Endpoint: ["R2_ENDPOINT", ""],
    r2AccessKeyId: ["R2_ACCESS_KEY_ID", ""],
    r2SecretAccessKey: ["R2_SECRET_ACCESS_KEY", ""],
    r2Bucket: ["R2_BUCKET_NAME", ""],
    r2PublicBaseUrl: ["R2_PUBLIC_BASE_URL", ""],
  },
  numbers: {
    mongoMaxPoolSize: { variable: "MONGO_MAX_POOL_SIZE", fallback: 10, min: 1, max: 50 },
    defaultMatchLimit: { variable: "MATCH_DEFAULT_LIMIT", fallback: 5, min: 1, max: 10 },
  },
});
