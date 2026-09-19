import AuthorSettings, {
  VISIBILITIES,
  defaultAuthorSettings,
} from "./settings.model.js";
import { ValidationError } from "../../core/utils/errors.js";

/**
 * Author settings service.
 *
 * Reads always resolve to a complete settings object (stored values merged
 * over the defaults), so callers never have to handle missing fields — even
 * for keys added in later releases.
 */

const BOOLEAN_KEYS = ["autosave", "showWordCount", "inDirectory", "twoStep"];
const NOTIFICATION_KEYS = ["likes", "comments", "followers"];

/** Notification `type` → setting key. Types without a key are always sent. */
const TYPE_TO_PREFERENCE = {
  like: "likes",
  comment: "comments",
  follow: "followers",
};

function shape(doc) {
  const defaults = defaultAuthorSettings();

  if (!doc) return defaults;

  const source = typeof doc.toObject === "function" ? doc.toObject() : doc;

  return {
    ...defaults,
    ...Object.fromEntries(
      ["defaultVisibility", ...BOOLEAN_KEYS]
        .filter((key) => source[key] !== undefined)
        .map((key) => [key, source[key]]),
    ),
    // Built key-by-key so documents saved before a key was removed can never
    // leak it back into an API response.
    notifications: Object.fromEntries(
      Object.keys(defaults.notifications).map((key) => [
        key,
        source.notifications?.[key] ?? defaults.notifications[key],
      ]),
    ),
  };
}

/** Settings for an author, defaulted when nothing has been saved yet. */
export async function getSettings(authorId) {
  if (!authorId) return defaultAuthorSettings();

  const doc = await AuthorSettings.findOne({ author: authorId }).lean();
  return shape(doc);
}

/**
 * Validate an incoming patch. Unknown keys are ignored; known keys must be
 * the right type, so a malformed client can never store a broken value.
 */
export function sanitizeSettingsPatch(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new ValidationError("Settings payload must be an object.");
  }

  const update = {};

  if (patch.defaultVisibility !== undefined) {
    if (!VISIBILITIES.includes(patch.defaultVisibility)) {
      throw new ValidationError(
        `defaultVisibility must be one of: ${VISIBILITIES.join(", ")}.`,
      );
    }
    update.defaultVisibility = patch.defaultVisibility;
  }

  for (const key of BOOLEAN_KEYS) {
    if (patch[key] === undefined) continue;

    if (typeof patch[key] !== "boolean") {
      throw new ValidationError(`${key} must be true or false.`);
    }
    update[key] = patch[key];
  }

  if (patch.notifications !== undefined) {
    const incoming = patch.notifications;

    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
      throw new ValidationError("notifications must be an object.");
    }

    for (const key of NOTIFICATION_KEYS) {
      if (incoming[key] === undefined) continue;

      if (typeof incoming[key] !== "boolean") {
        throw new ValidationError(`notifications.${key} must be true or false.`);
      }
      update[`notifications.${key}`] = incoming[key];
    }
  }

  if (Object.keys(update).length === 0) {
    throw new ValidationError("No valid settings were provided.");
  }

  return update;
}

/** Create or update an author's settings and return the complete result. */
export async function updateSettings({ authorId, patch }) {
  const update = sanitizeSettingsPatch(patch);

  await AuthorSettings.findOneAndUpdate(
    { author: authorId },
    { $set: update },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return getSettings(authorId);
}

/**
 * Should this notification be delivered?
 *
 * Only authors have tunable preferences today; other account types always
 * receive everything. Unknown types are delivered, and a lookup failure
 * errs on the side of delivering — a preference must never silently
 * swallow notifications because of an infrastructure hiccup.
 */
export async function isNotificationAllowed({ recipientModel, recipientId, type }) {
  const preference = TYPE_TO_PREFERENCE[type];

  if (!preference) return true;
  if (recipientModel !== "Author" || !recipientId) return true;

  try {
    const settings = await getSettings(recipientId);
    return settings.notifications[preference] !== false;
  } catch (error) {
    console.error("notification preference lookup failed:", error?.message || error);
    return true;
  }
}
