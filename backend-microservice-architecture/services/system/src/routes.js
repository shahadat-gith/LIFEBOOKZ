import { validate } from "@lifebookz/shared-validation";

import {
  applicationLogQuerySchema,
  logQuerySchema,
  roleParamSchema,
  verificationDecisionSchema,
} from "./validators.js";

/**
 * System service routes — `/system/*` and `/developer/*`.
 *
 * Access is role-restricted at the router level (defense-in-depth on top of
 * the API Gateway JWT authorizer): every route here requires the admin or
 * developer role claim, so an ordinary reader/author/expert token is 403
 * before any handler runs.
 */
const admin = (ctx) => ({
  actorId: ctx.claims?.accountId || "admin",
  role: ctx.claims?.role || "admin",
});

const clientIp = (ctx) => ctx.event?.requestContext?.http?.sourceIp || null;

const withSystemClaims = (ctx) => ({
  accountId: ctx.claims?.accountId,
  role: ctx.claims?.role,
  correlationId: ctx.correlationId,
});

export const routes = [
  // ------------------------------------------------------------------ admin
  {
    method: "GET",
    path: "/api/v1/system/me",
    access: ["admin"],
    operation: "adminMe",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.admin.me(withSystemClaims(ctx)) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/system/dashboard",
    access: ["admin"],
    operation: "adminDashboard",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.admin.dashboard() };
    },
  },
  {
    method: "GET",
    path: "/api/v1/system/authors/pending",
    access: ["admin"],
    operation: "pendingAuthors",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.admin.pendingAuthors() };
    },
  },
  {
    method: "GET",
    path: "/api/v1/system/authors/approved",
    access: ["admin"],
    operation: "approvedAuthors",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.admin.approvedAuthors() };
    },
  },
  {
    method: "GET",
    path: "/api/v1/system/experts/pending",
    access: ["admin"],
    operation: "pendingExperts",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.admin.pendingExperts() };
    },
  },
  {
    method: "GET",
    path: "/api/v1/system/experts/approved",
    access: ["admin"],
    operation: "approvedExperts",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.admin.approvedExperts() };
    },
  },
  {
    /**
     * Approve/reject an application. Auth executes the decision; System
     * coordinates, audits and publishes the event.
     */
    method: "PATCH",
    path: "/api/v1/system/{role}/{accountId}/verification",
    access: ["admin"],
    operation: "decideVerification",
    handler: async (ctx) => {
      await ctx.deps.ready();

      const { role } = validate(roleParamSchema, ctx.params);
      const input = validate(verificationDecisionSchema, ctx.body);

      const result = await ctx.deps.admin.decideVerification({
        accountId: ctx.params.accountId,
        role,
        decision: input.decision,
        reason: input.reason,
        actor: { accountId: admin(ctx).actorId, role: "admin" },
        ip: clientIp(ctx),
      });

      return { data: result, message: `Application ${input.decided}.` };
    },
  },

  // -------------------------------------------------------------- developer
  {
    method: "GET",
    path: "/api/v1/developer/me",
    access: ["developer"],
    operation: "developerMe",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.developer.me() };
    },
  },
  {
    method: "GET",
    path: "/api/v1/developer/logs",
    access: ["developer"],
    operation: "developerLogs",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const query = validate(logQuerySchema, ctx.query);

      return { data: await ctx.deps.developer.logs(query) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/developer/logs/stats",
    access: ["developer"],
    operation: "developerLogStats",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.developer.logStats() };
    },
  },
  {
    method: "GET",
    path: "/api/v1/developer/application-logs",
    access: ["developer"],
    operation: "developerApplicationLogs",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const query = validate(applicationLogQuerySchema, ctx.query);

      return { data: await ctx.deps.developer.applicationLogs(query) };
    },
  },
];

export default routes;
