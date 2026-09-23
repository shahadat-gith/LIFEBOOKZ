import { validationError } from "../../core/utils/errors.js";
import { CONSULT_CATEGORY_IDS } from "./constants.js";

/**
 * Multipart form fields arrive as strings. Accept a JSON array, a comma
 * separated list or an already-parsed array and return clean category ids.
 */
export function parseCategories(raw) {
  if (Array.isArray(raw)) {
    return raw.map((c) => String(c).trim()).filter(Boolean);
  }

  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((c) => String(c).trim()).filter(Boolean);
    }
  } catch {
    // Not JSON — fall back to comma separated handling below.
  }

  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Validate category ids against the canonical list and de-duplicate them
 * while preserving the submitted order.
 */
export function validateCategories(categories) {
  if (!categories.length) {
    throw validationError("Select at least one consultancy category.");
  }

  const invalid = categories.filter(
    (c) => !CONSULT_CATEGORY_IDS.includes(c),
  );

  if (invalid.length) {
    throw validationError(
      `Unknown consultancy category: ${invalid.join(", ")}.`,
    );
  }

  return [...new Set(categories)];
}

/**
 * Accept a JSON array or comma separated string of languages and always
 * return a non-empty list.
 */
export function parseLanguages(raw) {
  if (Array.isArray(raw)) {
    return raw.map((l) => String(l).trim()).filter(Boolean);
  }

  if (typeof raw !== "string" || !raw.trim()) return ["English"];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.map((l) => String(l).trim()).filter(Boolean);
      return cleaned.length ? cleaned : ["English"];
    }
  } catch {
    // Not JSON — treat as comma separated.
  }

  const cleaned = raw
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  return cleaned.length ? cleaned : ["English"];
}
