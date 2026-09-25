import { v } from "@lifebookz/shared-validation";

/** Validators stay inside the service that owns the domain. */
export const verificationDecisionSchema = {
  decision: v.enumOf(["approved", "rejected"]),
  reason: v.string({ max: 500 }).optional(),
};

export const roleParamSchema = {
  role: v.enumOf(["author", "expert"]),
};

export const logQuerySchema = {
  level: v.enumOf(["debug", "info", "warn", "error"]).optional(),
  action: v.string({ max: 100 }).optional(),
  actorRole: v.enumOf(["admin", "developer", "system"]).optional(),
  search: v.string({ max: 200 }).optional(),
  from: v.string({ max: 40 }).optional(),
  to: v.string({ max: 40 }).optional(),
  page: v.number({ min: 1, max: 10_000, integer: true }).default(1),
  limit: v.number({ min: 1, max: 200, integer: true }).default(50),
};

export const applicationLogQuerySchema = {
  level: v.enumOf(["debug", "info", "warn", "error"]).optional(),
  search: v.string({ max: 200 }).optional(),
  limit: v.number({ min: 1, max: 200, integer: true }).default(50),
};
