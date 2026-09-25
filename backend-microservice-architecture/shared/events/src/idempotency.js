/**
 * Idempotency guard for event consumers.
 *
 * EventBridge + SQS guarantee *at-least-once* delivery, so every consumer must
 * assume it may see the same `eventId` again. The guard is deliberately
 * storage-agnostic: the owning service passes a `store` backed by its own
 * MongoDB cluster (unique index on `eventId`) or DynamoDB (conditional write),
 * and this module only owns the protocol:
 *
 *   claim(eventId)   -> true  : first time we see it, process it
 *                    -> false : already handled, skip
 *   release(eventId) -> undo the claim when processing failed, so SQS's
 *                       redelivery actually retries the work
 *
 * A plain in-memory Set is never enough: each Lambda container would keep its
 * own copy and a redelivery to a new container would double-process.
 */
export function createIdempotencyGuard({ store, logger } = {}) {
  if (!store?.claim || !store?.release) {
    throw new Error(
      "createIdempotencyGuard requires a store implementing claim(eventId, meta) and release(eventId).",
    );
  }

  return {
    /**
     * Run `handler` exactly once per `eventId`.
     *
     * @returns {Promise<{status: 'processed'|'duplicate', result?: unknown}>}
     */
    async run({ eventId, eventType, meta = {}, handler }) {
      if (!eventId) {
        // An event without an id cannot be de-duplicated. Process it (dropping
        // real work would be worse) but make the gap visible in the logs.
        logger?.warn?.("Event has no eventId — idempotency guard skipped", { eventType });
        return { status: "processed", result: await handler() };
      }

      const claimed = await store.claim(eventId, { eventType, ...meta });

      if (!claimed) {
        logger?.info?.("Duplicate event ignored", { eventId, eventType });
        return { status: "duplicate" };
      }

      try {
        return { status: "processed", result: await handler() };
      } catch (error) {
        // Give the claim back so the SQS redelivery is not treated as a
        // duplicate and the message can actually be retried.
        try {
          await store.release(eventId);
        } catch (releaseError) {
          logger?.error?.("Failed to release idempotency claim", {
            eventId,
            error: releaseError.message,
          });
        }

        throw error;
      }
    },
  };
}

/**
 * In-memory store for unit tests and local development only.
 *
 * Never used in a deployed Lambda: it is per-container and would let a
 * redelivered event through after a cold start.
 */
export function createInMemoryIdempotencyStore({ ttlMs = 60 * 60 * 1000 } = {}) {
  const seen = new Map();

  return {
    async claim(eventId) {
      const existing = seen.get(eventId);
      const now = Date.now();

      if (existing && existing > now) return false;

      seen.set(eventId, now + ttlMs);
      return true;
    },
    async release(eventId) {
      seen.delete(eventId);
    },
    size: () => seen.size,
  };
}
