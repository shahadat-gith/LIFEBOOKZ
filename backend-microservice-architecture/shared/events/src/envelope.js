import { randomUUID } from "node:crypto";

import { DYNAMIC_SOURCE, SERVICE_SOURCES, eventDefinition } from "./registry.js";

export const EVENT_ENVELOPE_VERSION = 1;

/**
 * Build the LifeBookz event envelope.
 *
 * Contract (also documented in the root README):
 *
 *   {
 *     "eventId":      "uuid",            // stable across retries → idempotency key
 *     "eventType":    "StoryPublished",
 *     "eventVersion": 1,
 *     "occurredAt":   "2026-09-25T10:00:00.000Z",
 *     "source":       "lifebookz.story",
 *     "actor":        { "accountId": "…", "role": "author" } | null,
 *     "correlationId":"uuid",            // ties the HTTP request to its events
 *     "data":         { …only what consumers need }
 *   }
 */
export function buildEvent({
  type,
  data = {},
  actor = null,
  service,
  correlationId,
  eventId,
  occurredAt,
  envelopeVersion = EVENT_ENVELOPE_VERSION,
} = {}) {
  const definition = eventDefinition(type);

  const source =
    definition.source === DYNAMIC_SOURCE
      ? SERVICE_SOURCES[service] || (service?.startsWith("lifebookz.") ? service : undefined)
      : definition.source;

  if (!source) {
    throw new Error(
      `Event "${type}" uses a dynamic source; publisher must pass a known \`service\` (received: ${service}).`,
    );
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Event "${type}" data must be an object.`);
  }

  return {
    eventId: eventId || randomUUID(),
    eventType: type,
    eventVersion: definition.version,
    envelopeVersion,
    occurredAt: (occurredAt ? new Date(occurredAt) : new Date()).toISOString(),
    source,
    actor: actor
      ? {
          accountId: actor.accountId ? String(actor.accountId) : null,
          role: actor.role || null,
        }
      : null,
    ...(correlationId ? { correlationId } : {}),
    data,
  };
}

/**
 * Recognise an already-built envelope (allows a service to pass one through
 * when it re-publishes a received event).
 */
export function isEventEnvelope(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.eventId === "string" &&
      typeof value.eventType === "string" &&
      typeof value.eventVersion === "number" &&
      typeof value.source === "string",
  );
}

/** Strip anything a consumer must not rely on (defensive copy for handlers). */
export function eventSummary(envelope) {
  return {
    eventId: envelope?.eventId,
    eventType: envelope?.eventType,
    eventVersion: envelope?.eventVersion,
    source: envelope?.source,
    occurredAt: envelope?.occurredAt,
    actorId: envelope?.actor?.accountId || null,
  };
}
