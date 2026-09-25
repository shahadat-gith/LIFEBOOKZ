import { createMediaStore } from "@lifebookz/shared-aws";
import { createPublisher } from "@lifebookz/shared-events";

import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { createBookingRepository, createProcessedEventStore } from "./repositories/bookings.js";
import { createExpertProfileRepository } from "./repositories/expert-profiles.js";
import { createAccountEventHandlers } from "./consumers/account-events.js";
import { createBookingService } from "./services/bookings.js";
import { createExpertProfileService } from "./services/expert-profile.js";
import { createMatchingService } from "./services/matching.js";

/**
 * Dependency container: built once per Lambda container, reused for every warm
 * invocation. Repositories are stateless; the Mongo connection caches itself in
 * `db.js`, exactly like the monolith's single connection per process.
 */
export function createContainer({ logger }) {
  const publisher = createPublisher({ busName: config.eventBusName, service: "consultation", logger });

  const expertProfiles = createExpertProfileRepository();
  const bookings = createBookingRepository();
  const processedEvents = createProcessedEventStore();

  const mediaStore = createMediaStore({
    endpoint: config.r2Endpoint,
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
    bucket: config.r2Bucket,
    publicBaseUrl: config.r2PublicBaseUrl,
  });

  return {
    config,
    logger,
    publisher,
    expertProfiles,
    bookings,
    processedEvents,
    mediaStore,
    matchingService: createMatchingService({ expertProfiles, logger }),
    expertProfileService: createExpertProfileService({ expertProfiles, bookings, mediaStore, publisher, logger }),
    bookingService: createBookingService({ bookings, expertProfiles, publisher, logger }),
    eventHandlers: createAccountEventHandlers({ expertProfiles, logger }),

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
