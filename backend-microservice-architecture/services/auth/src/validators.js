import { v } from "@lifebookz/shared-validation";

import { ACCOUNT_ROLES } from "./models/account.js";

/** Validators stay inside the service that owns the domain. */
export const ACCOUNT_ROLE_IDS = [...ACCOUNT_ROLES];
export const LOGIN_ROLE_IDS = [...ACCOUNT_ROLES, "admin", "developer"];

const imageSchema = v.object({
  url: v.string({ max: 2000 }).default(""),
  key: v.string({ max: 500 }).default(""),
});

export const registerSchema = {
  role: v.enumOf(ACCOUNT_ROLE_IDS),
  email: v.email(),
  password: v.string({ min: 8, max: 200, trim: false }),
  fullName: v.string({ min: 2, max: 100 }),
  username: v.string({ min: 3, max: 30, pattern: /^[a-z0-9_.-]+$/ }).optional(),
};

export const loginSchema = {
  role: v.enumOf(LOGIN_ROLE_IDS),
  email: v.email(),
  password: v.string({ min: 1, max: 200, trim: false }),
};

export const refreshSchema = {
  refreshToken: v.string({ min: 16, max: 500, trim: false }),
};

export const logoutSchema = {
  /** Pass the presented refresh token to end just that session. */
  refreshToken: v.string({ min: 16, max: 500, trim: false }).optional(),
  /** Default behaviour: end every session of the caller. */
  all: v.boolean().default(true),
};

export const forgotPasswordSchema = { email: v.email() };

export const verifyResetOtpSchema = {
  email: v.email(),
  otp: v.string({ min: 6, max: 6, pattern: /^[0-9]{6}$/ }),
};

export const resetPasswordSchema = {
  resetToken: v.string({ min: 16, max: 500, trim: false }),
  password: v.string({ min: 8, max: 200, trim: false }),
};

export const updateMeSchema = {
  fullName: v.string({ min: 2, max: 100 }).optional(),
  avatar: imageSchema.optional(),
  coverImage: imageSchema.optional(),
  coverImageMobile: imageSchema.optional(),
};

export const presignSchema = {
  kind: v.enumOf(["userAvatar", "userCover", "userCoverMobile"]),
  contentType: v.string({ min: 3, max: 120 }),
  size: v.number({ min: 0, max: 600 * 1024 * 1024, integer: true }).default(0),
  filename: v.string({ max: 255 }).optional(),
};

export const verificationDecisionSchema = {
  decision: v.enumOf(["approved", "rejected"]),
  reason: v.string({ max: 500 }).optional(),
};
