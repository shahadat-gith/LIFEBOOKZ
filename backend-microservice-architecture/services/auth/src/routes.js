import { assertServiceToken, readServiceToken } from "@lifebookz/shared-auth";
import { validate } from "@lifebookz/shared-validation";

import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  presignSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateMeSchema,
  verificationDecisionSchema,
  verifyResetOtpSchema,
} from "./validators.js";

/**
 * The Auth service's routes.
 *
 * Path prefix `/api/v1` is kept so the existing frontends only have to change
 * their base URL, not their paths. The `/.well-known/*` routes are deliberately
 * outside the prefix: API Gateway's JWT authorizer fetches
 * `<issuer>/.well-known/openid-configuration`, and the issuer is the API root
 * (`https://api.lifebookz.com`).
 */
const clientIp = (ctx) => ctx.event?.requestContext?.http?.sourceIp || null;

const identity = (ctx) => ({
  accountId: ctx.claims?.accountId,
  role: ctx.claims?.role,
  correlationId: ctx.correlationId,
});

export const routes = [
  // ------------------------------------------------------------------ JWKS
  {
    method: "GET",
    path: "/.well-known/openid-configuration",
    access: "public",
    operation: "openIdConfiguration",
    handler: async (ctx) => ({ data: await ctx.deps.keyProvider.openIdConfiguration() }),
  },
  {
    method: "GET",
    path: "/.well-known/jwks.json",
    access: "public",
    operation: "jwks",
    handler: async (ctx) => ({ data: await ctx.deps.keyProvider.jwks() }),
  },

  // -------------------------------------------------------------- identity
  {
    method: "POST",
    path: "/api/v1/auth/register",
    access: "public",
    operation: "register",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(registerSchema, ctx.body);

      const result = await ctx.deps.registration.register({ ...input, ip: clientIp(ctx) });

      return { status: 201, data: result };
    },
  },
  {
    method: "POST",
    path: "/api/v1/auth/login",
    access: "public",
    operation: "login",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(loginSchema, ctx.body);

      const result = await ctx.deps.login.login({ ...input, ip: clientIp(ctx) });

      return { data: result };
    },
  },
  {
    method: "POST",
    path: "/api/v1/auth/refresh",
    access: "public",
    operation: "refreshSession",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(refreshSchema, ctx.body);

      return { data: await ctx.deps.sessions.refresh({ refreshToken: input.refreshToken }) };
    },
  },
  {
    method: "POST",
    path: "/api/v1/auth/logout",
    access: "authenticated",
    operation: "logout",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(logoutSchema, ctx.body);
      const { accountId } = identity(ctx);

      const result = await ctx.deps.sessions.revoke({
        accountId,
        refreshToken: input.refreshToken,
        all: input.all !== false,
      });

      return { data: result, message: "Logged out successfully." };
    },
  },
  {
    method: "GET",
    path: "/api/v1/auth/me",
    access: "authenticated",
    operation: "getMe",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.profile.me(identity(ctx)) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/auth/me",
    access: "authenticated",
    operation: "updateMe",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(updateMeSchema, ctx.body);

      return { data: await ctx.deps.profile.updateMe({ accountId: ctx.claims.accountId, input }) };
    },
  },

  // ------------------------------------------------------- password reset
  {
    method: "POST",
    path: "/api/v1/auth/forgot-password",
    access: "public",
    operation: "forgotPassword",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(forgotPasswordSchema, ctx.body);

      await ctx.deps.passwordReset.request({ email: input.email, ip: clientIp(ctx) });

      return {
        message:
          "If an account with that email exists, an OTP has been sent. Please check your inbox and spam folder.",
      };
    },
  },
  {
    method: "POST",
    path: "/api/v1/auth/verify-reset-otp",
    access: "public",
    operation: "verifyResetOtp",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(verifyResetOtpSchema, ctx.body);

      const result = await ctx.deps.passwordReset.verify({ ...input, ip: clientIp(ctx) });

      return { data: result, message: "OTP verified. You can now reset your password." };
    },
  },
  {
    method: "POST",
    path: "/api/v1/auth/reset-password",
    access: "public",
    operation: "resetPassword",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(resetPasswordSchema, ctx.body);

      await ctx.deps.passwordReset.complete(input);

      return { message: "Password reset successfully. You can now log in with your new password." };
    },
  },

  // ------------------------------------------------ reader profile (/users)
  {
    method: "GET",
    path: "/api/v1/users/me",
    access: ["user"],
    operation: "getReaderProfile",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.profile.me(identity(ctx)) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/users/me",
    access: ["user"],
    operation: "updateReaderProfile",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(updateMeSchema, ctx.body);

      return { data: await ctx.deps.profile.updateMe({ accountId: ctx.claims.accountId, input }) };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/users/me",
    access: ["user"],
    operation: "deleteReaderAccount",
    handler: async (ctx) => {
      await ctx.deps.ready();
      await ctx.deps.profile.deleteMe({ accountId: ctx.claims.accountId });

      return { message: "Account deleted successfully." };
    },
  },
  {
    method: "POST",
    path: "/api/v1/users/me/media/presign",
    access: ["user"],
    operation: "presignReaderMedia",
    handler: async (ctx) => {
      const input = validate(presignSchema, ctx.body);

      return { status: 201, data: await ctx.deps.profile.presignMedia({ accountId: ctx.claims.accountId, input }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/users/{userId}",
    access: "public",
    operation: "getPublicUser",
    handler: async (ctx) => {
      await ctx.deps.ready();
      return { data: await ctx.deps.profile.publicProfile({ userId: ctx.params.userId }) };
    },
  },

  // -------------------------------------------------- internal (system → auth)
  {
    /**
     * Admin decision on an author/expert application.
     *
     * Authenticated with the service token (not a JWT), because the caller is a
     * service, not a person. The route is intentionally the only one of its
     * kind; if more internal calls appear, move them behind a private API
     * Gateway/VPC endpoint instead of adding headers here.
     */
    method: "PATCH",
    path: "/api/v1/internal/accounts/{accountId}/verification",
    access: "public",
    operation: "decideVerification",
    handler: async (ctx) => {
      await ctx.deps.ready();

      const expected = await ctx.deps.getServiceToken();
      assertServiceToken(readServiceToken(ctx.headers), expected);

      const input = validate(verificationDecisionSchema, ctx.body);

      const result = await ctx.deps.verification.decide({
        accountId: ctx.params.accountId,
        decision: input.decision,
        reason: input.reason,
        decidedBy: ctx.headers["x-lifebookz-admin-id"] || "admin",
      });

      return { data: result };
    },
  },
];

export default routes;
