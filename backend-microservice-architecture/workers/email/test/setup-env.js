/**
 * Imported FIRST (before any module that loads config at import time).
 * ESM evaluates static imports in declaration order, so the required
 * environment variables exist by the time `src/config.js` runs — and the
 * suite needs no real AWS setup.
 */
process.env.SES_FROM_EMAIL ??= "noreply@lifebookz.com";
process.env.SES_FROM_NAME ??= "LifeBookz";
process.env.DYNAMODB_IDEMPOTENCY_TABLE ??= "test-table";
