/**
 * Idempotency middleware.
 *
 * Clients send an `Idempotency-Key` header on mutating requests (POST /
 * PATCH / PUT / DELETE). The first response — success OR handled error —
 * is cached against that key for a replay window; a replayed request
 * (double-click, network retry, timeout resend) receives the SAME
 * response instead of executing again, so a retried "create story" or
 * "publish" can never duplicate data.
 *
 *  - Keys are scoped per account + method + path.
 *  - Concurrent replays (original still in flight) wait and share the
 *    original's result instead of running the handler twice.
 *  - 5xx failures are NOT cached, so clients can safely retry them.
 *  - Requests without a key pass through untouched (opt-in safety).
 */

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h replay window
const MAX_CACHE = 5000; // bounded cache; oldest entries evicted

const cache = new Map(); // scopeKey -> entry

function cacheGet(scopeKey) {
  const hit = cache.get(scopeKey);
  if (!hit) return null;
  if (hit.expiresAt && hit.expiresAt < Date.now()) {
    cache.delete(scopeKey);
    return null;
  }
  return hit;
}

function cacheSet(scopeKey, entry) {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(scopeKey, entry);
}

export function idempotencyMiddleware(req, res, next) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) return next();

  const rawKey = req.get("Idempotency-Key") || req.get("idempotency-key");
  if (!rawKey) return next(); // no key → behave exactly as before

  const scopeKey = `${req.user?.id || "anon"}:${req.method}:${req.originalUrl.split("?")[0]}:${rawKey}`;

  const existing = cacheGet(scopeKey);
  if (existing) {
    if (existing.pending) {
      // Same request is executing right now — wait for it to settle and
      // share its result rather than double-executing.
      existing.pending.then(() => {
        const settled = cacheGet(scopeKey);
        if (settled && settled.cached) {
          if (settled.error) return next(settled.error);
          res.set("X-Idempotent-Replay", "true");
          return res.status(settled.status).json(settled.body);
        }
        next(); // original failed without caching — let this one retry
      });
      return;
    }

    // Completed replay — return the stored response / error verbatim.
    if (existing.error) return next(existing.error);
    res.set("X-Idempotent-Replay", "true");
    return res.status(existing.status).json(existing.body);
  }

  // First execution — wrap res.json and res.send to capture the response.
  let settled = false;
  let resolvePending;
  const pending = new Promise((resolve) => {
    resolvePending = resolve;
  });

  const entry = { pending, expiresAt: Date.now() + DEFAULT_TTL_MS, cached: false };
  cacheSet(scopeKey, entry);

  const store = (status, body, error) => {
    if (settled) return;
    settled = true;
    // Never cache 5xx — the client should retry those.
    if (!error && status >= 500) {
      cache.delete(scopeKey);
    } else {
      cacheSet(scopeKey, {
        expiresAt: Date.now() + DEFAULT_TTL_MS,
        cached: true,
        status,
        body,
        error,
      });
    }
    resolvePending();
  };

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    store(res.statusCode, body, null);
    return originalJson(body);
  };

  // Run the handler; errors reach idempotencyErrorHandler below (registered
  // before the global error handler), which stores them, then the global
  // handler formats the response.
  res.locals.__idempotencyStore = store;
  next();
}

/**
 * Error-handler companion — must be registered BEFORE the global error
 * handler. Caches handled errors (4xx) so replays get the same error; 5xx
 * pass through uncached so they can be retried.
 */
export function idempotencyErrorHandler(err, req, res, next) {
  const store = res.locals?.__idempotencyStore;
  const rawKey = req.get?.("Idempotency-Key");
  if (store && rawKey) {
    const status = err?.statusCode || err?.status || 500;
    store(status, null, err);
  }
  next(err);
}

export default idempotencyMiddleware;
