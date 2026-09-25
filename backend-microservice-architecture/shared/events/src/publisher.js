import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

import { upstreamError } from "@lifebookz/shared-errors";

import { buildEvent } from "./envelope.js";

let defaultClient;

export function getEventBridgeClient({ region = process.env.AWS_REGION || "ap-south-1", client } = {}) {
  if (client) return client;
  if (!defaultClient) defaultClient = new EventBridgeClient({ region });

  return defaultClient;
}

/**
 * Domain event publisher.
 *
 * Business services publish through this and never talk to EventBridge
 * directly, so `Source`/`DetailType`/versioning stay consistent.
 */
export function createPublisher({ busName, region, client, service, logger } = {}) {
  const eventBus = busName || process.env.EVENT_BUS_NAME;

  async function publish({ type, data, actor, correlationId, eventId, occurredAt, envelope }) {
    const event = envelope || buildEvent({ type, data, actor, service, correlationId, eventId, occurredAt });

    if (!eventBus) {
      throw upstreamError("EVENT_BUS_NAME is not configured — cannot publish domain events.");
    }

    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: eventBus,
          Source: event.source,
          DetailType: event.eventType,
          Time: new Date(event.occurredAt),
          Detail: JSON.stringify(event),
        },
      ],
    });

    const response = await getEventBridgeClient({ region, client }).send(command);

    if (response?.FailedEntryCount) {
      const failure = response.Entries?.find((entry) => entry.ErrorCode);
      throw upstreamError(
        `EventBridge rejected ${event.eventType}: ${failure?.ErrorCode} ${failure?.ErrorMessage || ""}`.trim(),
      );
    }

    logger?.debug?.("Domain event published", {
      eventId: event.eventId,
      eventType: event.eventType,
      source: event.source,
    });

    return event;
  }

  /**
   * Publish without ever breaking the caller's transaction.
   *
   * Publishing a notification-worthy event must not fail a publish/like/booking
   * request, so this mirrors the existing backend's `sendEmailSafely`: the
   * failure is logged and swallowed.
   */
  async function publishSafely(input) {
    try {
      return await publish(input);
    } catch (error) {
      logger?.warn?.("Domain event publish failed", {
        eventType: input?.type,
        error: error.message,
      });

      return null;
    }
  }

  return { publish, publishSafely, eventBus };
}
