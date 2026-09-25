import { loadConfig } from "@lifebookz/shared-aws";

export const config = loadConfig({
  service: "story",
  required: {
    eventBusName: "EVENT_BUS_NAME",
  },
  optional: {
    mongoSecretId: ["MONGODB_STORY_URI_SECRET_ID", ""],
    mongoUri: ["MONGODB_STORY_URI", ""],
    r2Endpoint: ["R2_ENDPOINT", ""],
    r2AccessKeyId: ["R2_ACCESS_KEY_ID", ""],
    r2SecretAccessKey: ["R2_SECRET_ACCESS_KEY", ""],
    r2Bucket: ["R2_BUCKET_NAME", ""],
    r2PublicBaseUrl: ["R2_PUBLIC_BASE_URL", ""],
    frontendClientUrl: ["FRONTEND_CLIENT_URL", ""],
  },
  numbers: {
    mongoMaxPoolSize: { variable: "MONGO_MAX_POOL_SIZE", fallback: 15, min: 1, max: 50 },
    feedPageSize: { variable: "FEED_PAGE_SIZE", fallback: 12, min: 1, max: 50 },
    maxChapters: { variable: "MAX_CHAPTERS", fallback: 50, min: 7, max: 100 },
    /**
     * How many followers may travel inside one `StoryPublished` event. An
     * EventBridge event is limited to 256 KB, and the fan-out list is part of
     * the payload, so the cap is a hard requirement rather than a preference.
     */
    maxPublishFanout: { variable: "MAX_PUBLISH_FANOUT", fallback: 500, min: 1, max: 5000 },
  },
});
