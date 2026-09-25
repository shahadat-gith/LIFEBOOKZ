import { createQueueSender } from "@lifebookz/shared-aws";
import { createPublisher } from "@lifebookz/shared-events";

import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { createAccountProjectionRepository, createNotificationRepository, createProcessedEventStore } from "./repositories/notifications.js";
import { createDomainEventHandlers } from "./consumers/domain-events.js";
import { createEmailJobService } from "./services/email-jobs.js";
import { createNotificationService } from "./services/notifications.js";

/**
 * Dependency container — built once per Lambda container and reused by every
 * warm invocation.
 *
 * The email queue sender reads `SQS_EMAIL_QUEUE_URL` (exported by the email
 * worker's stack). Where it is absent — local development — `sendSafely`
 * reports a failure instead of throwing, which is exactly what a real SQS
 * outage looks like: the notification is still stored, the request still
 * succeeds.
 */
export function createContainer({ logger }) {
  const publisher = createPublisher({ busName: config.eventBusName, service: "notification", logger });

  const queue = createQueueSender({
    queueUrl: config.emailQueueUrl,
    region: config.region,
    service: "notification",
    logger,
  });

  const notifications = createNotificationRepository({ maxPerPage: config.maxNotificationsPerPage });
  const accountProjections = createAccountProjectionRepository();
  const processedEvents = createProcessedEventStore();

  const notificationService = createNotificationService({ notifications, accountProjections, logger, cfg: config });
  const emailJobService = createEmailJobService({ queue, config, logger });

  return {
    config,
    logger,
    publisher,
    queue,
    notifications,
    accountProjections,
    processedEvents,
    notificationService,
    emailJobService,

    eventHandlers: createDomainEventHandlers({
      // The consumer only ever creates notifications and fans out; it never
      // reads or mutates one, so it gets a narrow facade rather than the read API.
      notifications: { create: notificationService.create, createMany: notificationService.createMany },
      accountProjections,
      emailJobs: emailJobService,
      publisher,
      logger,
      cfg: config,
    }),

    async ready() {
      await connectDatabase();
      return true;
    },
  };
}

let cached;

export function getDeps({ logger } = {}) {
  if (!cached) cached = createContainer({ logger });

  return cached;
}

export function resetContainer() {
  cached = undefined;
}
