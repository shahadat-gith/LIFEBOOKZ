import { loadConfig } from "@lifebookz/shared-aws";

/**
 * Email worker configuration.
 *
 * No MongoDB, no business state: the worker only needs SES identity settings,
 * its own DynamoDB idempotency table, and the DLQ behaviour is configured at
 * the queue (redrive policy), not here.
 */
export const config = loadConfig({
  service: "email-worker",
  required: {
    fromEmail: "SES_FROM_EMAIL",
  },
  optional: {
    fromName: ["SES_FROM_NAME", "LifeBookz"],
    replyTo: ["SES_REPLY_TO", ""],
    sesRegion: ["SES_REGION", ""],
    configurationSet: ["SES_CONFIGURATION_SET", ""],
    idempotencyTable: ["DYNAMODB_IDEMPOTENCY_TABLE", "lifebookz-email-worker-idempotency"],
    region: ["AWS_REGION", "ap-south-1"],
  },
});
