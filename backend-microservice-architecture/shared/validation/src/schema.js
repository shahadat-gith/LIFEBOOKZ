import { validationError } from "@lifebookz/shared-errors";

/**
 * Reusable validation primitives.
 *
 * Domain schemas stay inside the owning service (story schemas in `story`,
 * consultation schemas in `consultation`, …); this module only knows how to
 * describe a field, coerce it and collect the messages, so every service
 * reports validation failures with the same `fields` map the frontends
 * already understand.
 */

const FIELD = Symbol("lifebookz.field");

const isField = (value) => Boolean(value && value[FIELD]);

function field({ parse, optional = false, defaultValue }) {
  return {
    [FIELD]: true,
    isOptional: optional,
    defaultValue,
    parse,
    optional() {
      return field({ parse, optional: true, defaultValue });
    },
    default(value) {
      return field({ parse, optional: true, defaultValue: value });
    },
  };
}

export const v = {
  string({ min, max, pattern, trim = true, lowercase = false } = {}) {
    return field({
      parse: (value, path, fail) => {
        if (typeof value !== "string") {
          fail(path, `${path} must be text.`);
          return undefined;
        }

        let text = trim ? value.trim() : value;
        if (lowercase) text = text.toLowerCase();

        if (min !== undefined && text.length < min) {
          fail(path, `${path} must be at least ${min} characters.`);
        }
        if (max !== undefined && text.length > max) {
          fail(path, `${path} must be at most ${max} characters.`);
        }
        if (pattern && !pattern.test(text)) {
          fail(path, `${path} has an invalid format.`);
        }

        return text;
      },
    });
  },

  email() {
    return v.string({ min: 5, max: 254, lowercase: true, pattern: /^\S+@\S+\.\S+$/ });
  },

  number({ min, max, integer = false } = {}) {
    return field({
      parse: (value, path, fail) => {
        const number = typeof value === "number" ? value : Number(value);

        if (value === null || value === "" || Number.isNaN(number)) {
          fail(path, `${path} must be a number.`);
          return undefined;
        }
        if (integer && !Number.isInteger(number)) {
          fail(path, `${path} must be a whole number.`);
        }
        if (min !== undefined && number < min) {
          fail(path, `${path} must be at least ${min}.`);
        }
        if (max !== undefined && number > max) {
          fail(path, `${path} must be at most ${max}.`);
        }

        return number;
      },
    });
  },

  boolean() {
    return field({
      parse: (value, path, fail) => {
        if (typeof value === "boolean") return value;
        if (value === "true") return true;
        if (value === "false") return false;

        fail(path, `${path} must be true or false.`);
        return undefined;
      },
    });
  },

  enumOf(values, { label = "value" } = {}) {
    return field({
      parse: (value, path, fail) => {
        if (!values.includes(value)) {
          fail(path, `${path} must be one of: ${values.join(", ")}.`);
          return undefined;
        }

        return value;
      },
      label,
    });
  },

  objectId() {
    return field({
      parse: (value, path, fail) => {
        const text = String(value ?? "");
        if (!/^[0-9a-fA-F]{24}$/.test(text)) {
          fail(path, `${path} must be a valid identifier.`);
          return undefined;
        }

        return text;
      },
    });
  },

  arrayOf(item, { min, max } = {}) {
    return field({
      parse: (value, path, fail) => {
        if (!Array.isArray(value)) {
          fail(path, `${path} must be a list.`);
          return undefined;
        }
        if (min !== undefined && value.length < min) {
          fail(path, `${path} must contain at least ${min} item(s).`);
        }
        if (max !== undefined && value.length > max) {
          fail(path, `${path} must contain at most ${max} item(s).`);
        }

        return value.map((entry, index) => parseValue(item, entry, `${path}[${index}]`, fail));
      },
    });
  },

  object(shape) {
    return field({
      parse: (value, path, fail) => {
        if (value === null || typeof value !== "object" || Array.isArray(value)) {
          fail(path, `${path} must be an object.`);
          return undefined;
        }

        return parseShape(shape, value, path, fail);
      },
    });
  },

  /** Free-form: accepts anything and passes it through. */
  any() {
    return field({ parse: (value) => value });
  },
};

function parseValue(schema, value, path, fail) {
  if (!isField(schema)) {
    // Nested `object`/`arrayOf` shapes are plain functions/shape maps.
    if (schema && typeof schema === "object") return parseShape(schema, value, path, fail);
    return value;
  }

  return schema.parse(value, path, fail);
}

function parseShape(shape, input, prefix, fail, output = {}) {
  for (const [key, schema] of Object.entries(shape)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const raw = input?.[key];

    if (raw === undefined || raw === null || raw === "") {
      if (isField(schema) && schema.defaultValue !== undefined) {
        output[key] = typeof schema.defaultValue === "function"
          ? schema.defaultValue()
          : schema.defaultValue;
        continue;
      }

      if (isField(schema) && schema.isOptional) continue;

      fail(path, `${path} is required.`);
      continue;
    }

    const parsed = parseValue(schema, raw, path, fail);
    if (parsed !== undefined) output[key] = parsed;
  }

  return output;
}

/**
 * Validate `input` against `shape`.
 *
 * @returns {object} the sanitised value — unknown keys are dropped on purpose
 *                   so a client cannot inject fields the schema never allowed.
 * @throws  {Error}  validationError (422) with a `fields` map when invalid.
 */
export function validate(shape, input = {}, { prefix = "" } = {}) {
  const fields = {};
  const fail = (path, message) => {
    fields[path] = message;
  };

  const value = parseShape(shape, input || {}, prefix, fail);

  const keys = Object.keys(fields);
  if (keys.length > 0) {
    throw validationError("Validation failed. Check the fields for details.", { fields });
  }

  return value;
}

/** Parse a JSON string field (multipart/form-data sends nested objects as text). */
export function parseJsonField(value, { fallback } = {}) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export const isFieldDescriptor = isField;
