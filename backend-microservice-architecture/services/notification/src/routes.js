import { notFoundError } from "@lifebookz/shared-errors";
import { validate } from "@lifebookz/shared-validation";

import { listQuerySchema } from "./validators.js";

/**
 * Notification routes — identical paths and access rules to the existing
 * backend's `modules/notification/routes.js`, so the bell dropdown, the drawer
 * and the unread badge keep working without a frontend change.
 *
 * Every route is per-account; the recipient is derived from the token role, so
 * a reader can never read or clear an author's inbox.
 */
const ACCOUNT_ROLES = ["user", "author", "expert"];

export const routes = [
  {
    method: "GET",
    path: "/api/v1/notifications",
    access: ACCOUNT_ROLES,
    operation: "listNotifications",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const query = validate(listQuerySchema, ctx.query);

      return { data: await ctx.deps.notificationService.list({ claims: ctx.claims, limit: query.limit, before: query.before }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/notifications/unread-count",
    access: ACCOUNT_ROLES,
    operation: "getUnreadCount",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.notificationService.unreadCount({ claims: ctx.claims }) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/notifications/read-all",
    access: ACCOUNT_ROLES,
    operation: "markAllNotificationsRead",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.notificationService.markAllRead({ claims: ctx.claims }) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/notifications/{notificationId}/read",
    access: ACCOUNT_ROLES,
    operation: "markNotificationRead",
    handler: async (ctx) => {
      await ctx.deps.ready();

      const data = await ctx.deps.notificationService.markRead({
        claims: ctx.claims,
        notificationId: ctx.params.notificationId,
      });

      // Not found *for this recipient* — another account's id is a 404, never a 403.
      if (!data) throw notFoundError("Notification not found.");

      return { data };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/notifications",
    access: ACCOUNT_ROLES,
    operation: "clearNotifications",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.notificationService.clearAll({ claims: ctx.claims }) };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/notifications/{notificationId}",
    access: ACCOUNT_ROLES,
    operation: "deleteNotification",
    handler: async (ctx) => {
      await ctx.deps.ready();

      const deleted = await ctx.deps.notificationService.remove({
        claims: ctx.claims,
        notificationId: ctx.params.notificationId,
      });

      if (!deleted) throw notFoundError("Notification not found.");

      return { message: "Notification deleted." };
    },
  },
];

export default routes;
