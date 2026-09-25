/**
 * Imported FIRST (before any module that loads config at import time).
 * ESM evaluates static imports in declaration order, so the required
 * environment variables exist by the time `src/config.js` runs.
 */
process.env.ANALYTICS_S3_BUCKET ??= "lifebookz-analytics";
process.env.ANALYTICS_S3_PREFIX ??= "events/";
