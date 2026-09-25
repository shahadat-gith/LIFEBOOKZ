/**
 * Environment contract enforcement.
 *
 * A Lambda that boots with a missing variable fails on the first request
 * instead of at cold start, which turns a configuration mistake into a
 * confusing 500. Every service builds its config once (module scope) so a
 * misconfigured deployment fails immediately and loudly.
 */

export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function requireEnv(name, { service } = {}) {
  const value = process.env[name];

  if (value === undefined || value === null || String(value).trim() === "") {
    throw new ConfigurationError(
      `[${service || "service"}] Missing required environment variable "${name}".`,
    );
  }

  return value;
}

export function optionalEnv(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  return value;
}

export function numberEnv(name, { fallback, min, max, integer = true, service } = {}) {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    if (fallback === undefined) {
      throw new ConfigurationError(`[${service || "service"}] Missing required number "${name}".`);
    }

    return fallback;
  }

  const value = Number(raw);

  if (Number.isNaN(value)) {
    throw new ConfigurationError(`[${service || "service"}] "${name}" must be a number (got "${raw}").`);
  }
  if (integer && !Number.isInteger(value)) {
    throw new ConfigurationError(`[${service || "service"}] "${name}" must be a whole number (got "${raw}").`);
  }
  if (min !== undefined && value < min) {
    throw new ConfigurationError(`[${service || "service"}] "${name}" must be >= ${min} (got "${raw}").`);
  }
  if (max !== undefined && value > max) {
    throw new ConfigurationError(`[${service || "service"}] "${name}" must be <= ${max} (got "${raw}").`);
  }

  return value;
}

export function listEnv(name, { fallback = [], separator = "," } = {}) {
  const raw = process.env[name];
  if (!raw) return fallback;

  return raw
    .split(separator)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Build a frozen config object from an explicit contract.
 *
 * @example
 *   const config = loadConfig({
 *     service: "story",
 *     required: { mongoUri: "MONGODB_STORY_URI", eventBus: "EVENT_BUS_NAME" },
 *     optional: { r2Bucket: ["R2_BUCKET_NAME", "lifebookz"] },
 *   });
 */
export function loadConfig({ service, required = {}, optional = {}, numbers = {}, lists = {} } = {}) {
  const config = { service, env: optionalEnv("NODE_ENV", "dev"), region: optionalEnv("AWS_REGION", "ap-south-1") };

  const missing = [];

  for (const [key, variable] of Object.entries(required)) {
    const value = process.env[variable];
    if (value === undefined || value === null || String(value).trim() === "") {
      missing.push(variable);
      continue;
    }
    config[key] = value;
  }

  if (missing.length > 0) {
    throw new ConfigurationError(
      `[${service}] Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Check the service .env.example and the stack's provider.environment block.",
    );
  }

  for (const [key, [variable, fallback]] of Object.entries(optional)) {
    config[key] = optionalEnv(variable, fallback);
  }

  for (const [key, spec] of Object.entries(numbers)) {
    config[key] = numberEnv(spec.variable, { ...spec, service });
  }

  for (const [key, spec] of Object.entries(lists)) {
    config[key] = listEnv(spec.variable, spec);
  }

  return Object.freeze(config);
}
