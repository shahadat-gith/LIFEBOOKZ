import { createMediaStore } from "@lifebookz/shared-aws";
import { createPublisher } from "@lifebookz/shared-events";

import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { createAuthorProfileRepository } from "./repositories/author-profiles.js";
import { createEngagementRepository } from "./repositories/engagement.js";
import { createLifebookRepository } from "./repositories/lifebooks.js";
import { createProcessedEventStore, createTestimonialRepository } from "./repositories/testimonials.js";
import { createAccountEventHandlers } from "./consumers/account-events.js";
import { createAuthorProfileService } from "./services/author-profile.js";
import { createEngagementService } from "./services/engagement.js";
import { createLifebookService } from "./services/lifebooks.js";
import { createTestimonialService } from "./services/testimonials.js";

export function createContainer({ logger }) {
  const publisher = createPublisher({ busName: config.eventBusName, service: "story", logger });

  const authorProfiles = createAuthorProfileRepository();
  const lifebooks = createLifebookRepository({ authorProfiles });
  const engagement = createEngagementRepository();
  const testimonials = createTestimonialRepository();
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
    authorProfiles,
    lifebooks,
    engagement,
    testimonials,
    processedEvents,
    mediaStore,
    lifebookService: createLifebookService({ lifebooks, authorProfiles, engagement, mediaStore, publisher, logger, cfg: config }),
    authorProfileService: createAuthorProfileService({ authorProfiles, lifebooks, engagement, mediaStore, publisher, logger }),
    engagementService: createEngagementService({ lifebooks, authorProfiles, engagement, publisher, logger }),
    testimonialService: createTestimonialService({ testimonials, publisher, logger }),
    eventHandlers: createAccountEventHandlers({ authorProfiles, lifebooks, logger }),
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
