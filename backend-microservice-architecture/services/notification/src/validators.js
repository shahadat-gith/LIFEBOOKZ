import { v } from "@lifebookz/shared-validation";

export const listQuerySchema = {
  limit: v.number({ min: 1, max: 50, integer: true }).default(20),
  /** Cursor: the id of the last notification the client already has. */
  before: v.string({ max: 64 }).optional(),
};

export const notificationIdSchema = {
  notificationId: v.string({ min: 1, max: 64 }),
};
