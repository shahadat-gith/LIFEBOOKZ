import { loadConfig } from "@lifebookz/shared-aws";

/**
 * Analytics worker configuration.
 *
 * No MongoDB by design (see spec §25): the analytics store is S3, queried
 * with Athena. Only the bucket/prefix wiring is needed here.
 */
export const config = loadConfig({
  service: "analytics-worker",
  required: {
    bucket: "ANALYTICS_S3_BUCKET",
  },
  optional: {
    prefix: ["ANALYTICS_S3_PREFIX", "events/"],
    region: ["AWS_REGION", "ap-south-1"],
  },
});
