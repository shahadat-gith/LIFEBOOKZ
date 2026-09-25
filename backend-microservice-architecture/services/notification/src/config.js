import { loadConfig } from "@lifebookz/shared-aws";

export const config = loadConfig({
  service: "notification",
  required: {
    eventBusName: "EVENT_BUS_NAME",
  },
  optional: {
    mongoSecretId: ["MONGODB_NOTIFICATION_URI_SECRET_ID", ""],
    mongoUri: ["MONGODB_NOTIFICATION_URI", ""],
    /**
     * The email worker's queue. Optional in local development so unit tests and
     * a bare `node --test` run do not need SQS.
     */
    emailQueueUrl: ["SQS_EMAIL_QUEUE_URL", ""],
    frontendClientUrl: ["FRONTEND_CLIENT_URL", "http://localhost:5173"],
    frontendAuthorUrl: ["FRONTEND_AUTHOR_URL", "http://localhost:5174"],
    frontendExpertUrl: ["FRONTEND_EXPERT_URL", "http://localhost:5176"],
  },
  numbers: {
    mongoMaxPoolSize: { variable: "MONGO_MAX_POOL_SIZE", fallback: 10, min: 1, max: 50 },
    /**
     * EventBridge caps an event at 256 KB, and an unbounded follower fan-out
     * would also make one Lambda do thousands of writes. The cap is explicit and
     * configurable; the monolith's unbounded loop only worked because it ran
     * in-process. See the README for the scaling note.
     */
    maxNotificationFanout: { variable: "MAX_NOTIFICATION_FANOUT", fallback: 500, min: 1, max: 5000 },
    maxNotificationsPerPage: { variable: "MAX_NOTIFICATIONS_PER_PAGE", fallback: 50, min: 1, max: 200 },
  },
});
