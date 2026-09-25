/**
 * Analytics record mapping.
 *
 * The worker flattens each domain event into a query-friendly analytics
 * record: one row per event, scalar columns for the common fields, `data`
 * preserved as a JSON string (queryable with Athena's `json_extract`).
 *
 * PII discipline: fields whose value is a secret (OTP codes) or personally
 * identifying beyond the actor id are dropped here — the analytics layer is
 * for aggregate product questions, not surveillance.
 */

/** Envelope fields an analytics record needs; everything else in `data` is dropped. */
const FORBIDDEN_DATA_KEYS = /^(password|otp|token|secret|email|authorization)/i;

/**
 * Validate and normalize one domain event into an analytics record.
 *
 * @returns {object|null} null when the event must be skipped (unparseable or
 *          missing a usable eventId/occurredAt — reported as failure so the
 *          DLQ captures it, because silently dropping work is worse).
 */
export function normalizeEvent(event, logger) {
  if (!event || typeof event !== "object") return null;

  const { eventId, eventType, occurredAt, source } = event;

  if (!eventId || !eventType || !occurredAt) {
    logger?.warn?.("Analytics event missing identity fields — will be reported as failed", {
      eventId: eventId || null,
      eventType: eventType || null,
    });
    return null;
  }

  const occurred = new Date(occurredAt);
  if (Number.isNaN(occurred.getTime())) {
    logger?.warn?.("Analytics event has an invalid occurredAt", { eventId, eventType, occurredAt });
    return null;
  }

  // Partition fields derived from occurredAt (Athena partition projection).
  const year = String(occurred.getUTCFullYear());
  const month = String(occurred.getUTCMonth() + 1).padStart(2, "0");
  const day = String(occurred.getUTCDate()).padStart(2, "0");

  // Scrub PII/secret-looking keys from the payload copy.
  const data = {};
  for (const [key, value] of Object.entries(event.data || {})) {
    if (FORBIDDEN_DATA_KEYS.test(key)) continue;
    data[key] = value;
  }

  return {
    eventId,
    eventType,
    eventVersion: event.eventVersion ?? 1,
    source: source || "unknown",
    occurredAt: occurred.toISOString(),
    actorId: event.actor?.accountId || null,
    actorRole: event.actor?.role || null,
    correlationId: event.correlationId || null,
    year,
    month,
    day,
    data,
  };
}

/** The object key for one batch of records (hour-bucketed for compaction). */
export function recordKey(record, hour, { prefix = "events/" } = {}) {
  return (
    `${prefix}year=${record.year}/month=${record.month}/day=${record.day}/` +
    `${record.occurredAt.slice(0, 13).replace(/[-:T]/g, "")}-${hour}-${Math.random().toString(36).slice(2, 8)}.jsonl`
  );
}

/** Map one normalized record to its JSONL line. */
export function toAnalyticsLine(record) {
  return JSON.stringify(record);
}

export function createAnalyticsMapper({ logger } = {}) {
  return {
    normalize: (event) => normalizeEvent(event, logger),
    line: toAnalyticsLine,
    key: recordKey,
  };
}
