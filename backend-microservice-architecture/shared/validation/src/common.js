import { v } from "./schema.js";

/** Account roles that can sign in (mirrors the existing backend's roles). */
export const ACCOUNT_ROLES = ["user", "author", "expert"];
export const PRIVILEGED_ROLES = ["admin", "developer"];
export const ALL_ROLES = [...ACCOUNT_ROLES, ...PRIVILEGED_ROLES];

/**
 * Cursor/offset pagination.
 *
 * The existing backend used `page`/`limit` on list endpoints and a `before`
 * cursor on notifications — both are kept, so the frontends do not change.
 */
export const paginationSchema = {
  page: v.number({ min: 1, integer: true }).default(1),
  limit: v.number({ min: 1, max: 50, integer: true }).default(20),
};

export const beforeCursorSchema = {
  limit: v.number({ min: 1, max: 50, integer: true }).default(20),
  before: v.objectId().optional(),
};

/** Limits a free-text search box the same way the monolith did. */
export const searchSchema = {
  q: v.string({ min: 1, max: 120 }),
  limit: v.number({ min: 1, max: 50, integer: true }).default(20),
  profession: v.string({ max: 100 }).optional(),
};

export const mediaReferenceSchema = {
  url: v.string({ min: 1, max: 2000 }),
  key: v.string({ max: 500 }).default(""),
  type: v.enumOf(["image", "video"]).default("image"),
  caption: v.string({ max: 300 }).default(""),
};

export const visibilitySchema = v.enumOf(["public", "followers", "private"]).default("public");
