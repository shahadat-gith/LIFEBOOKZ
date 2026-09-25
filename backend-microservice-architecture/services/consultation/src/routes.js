import { validate } from "@lifebookz/shared-validation";

import {
  createBookingSchema,
  expertPresignSchema,
  expertProfileSchema,
  matchSchema,
  mediaReferenceSchema,
  updateBookingStatusSchema,
} from "./validators.js";

/**
 * Consultation's routes.
 *
 * Shapes are preserved from the existing backend (`/consult/*` for readers,
 * `/experts/*` for experts) so the client portal's booking flow and the expert
 * portal's dashboard keep their paths:
 *
 *   POST   /consult/match                      → readers only
 *   POST   /consult/bookings                   → readers only
 *   GET    /consult/bookings                   → readers only
 *   PATCH  /consult/bookings/{id}/cancel       → readers only
 *   GET    /experts/me                         → experts only
 *   PATCH  /experts/me                         → experts only
 *   GET    /experts/me/bookings                → experts only
 *   PATCH  /experts/me/bookings/{id}           → experts only
 *   GET    /experts/{expertId}                 → public
 *
 * The reader/expert split is deliberate: an expert token must not be usable on
 * the reader booking flow (the monolith's `authorize("user")` did the same).
 */
export const routes = [
  // ------------------------------------------------------------- matching
  {
    method: "POST",
    path: "/api/v1/consult/match",
    access: ["user"],
    operation: "matchExperts",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(matchSchema, ctx.body);

      return { data: await ctx.deps.matchingService.match(input) };
    },
  },

  // ------------------------------------------------------------- bookings
  {
    method: "POST",
    path: "/api/v1/consult/bookings",
    access: ["user"],
    operation: "createBooking",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(createBookingSchema, ctx.body);

      return {
        status: 201,
        data: await ctx.deps.bookingService.book({
          accountId: ctx.claims.accountId,
          claims: ctx.claims,
          input,
        }),
      };
    },
  },
  {
    method: "GET",
    path: "/api/v1/consult/bookings",
    access: ["user"],
    operation: "listMyBookings",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.bookingService.listMine({ accountId: ctx.claims.accountId }) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/consult/bookings/{bookingId}/cancel",
    access: ["user"],
    operation: "cancelMyBooking",
    handler: async (ctx) => {
      await ctx.deps.ready();

      const data = await ctx.deps.bookingService.cancel({
        accountId: ctx.claims.accountId,
        bookingId: ctx.params.bookingId,
      });

      return { data, message: "Booking cancelled." };
    },
  },

  // --------------------------------------------------------- expert portal
  {
    method: "GET",
    path: "/api/v1/experts/me",
    access: ["expert"],
    operation: "getMyExpertProfile",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.expertProfileService.mine({ accountId: ctx.claims.accountId }) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/experts/me",
    access: ["expert"],
    operation: "updateMyExpertProfile",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(expertProfileSchema, ctx.body);

      return {
        data: await ctx.deps.expertProfileService.update({
          accountId: ctx.claims.accountId,
          claims: ctx.actor,
          input,
        }),
      };
    },
  },
  {
    method: "POST",
    path: "/api/v1/experts/me/media/presign",
    access: ["expert"],
    operation: "presignExpertMedia",
    handler: async (ctx) => {
      const input = validate(expertPresignSchema, ctx.body);

      return { status: 201, data: await ctx.deps.expertProfileService.presignMedia({ accountId: ctx.claims.accountId, input }) };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/experts/me/media",
    access: ["expert"],
    operation: "deleteExpertMedia",
    handler: async (ctx) => {
      const input = validate(mediaReferenceSchema, ctx.body);

      return {
        data: await ctx.deps.expertProfileService.deleteMedia({ accountId: ctx.claims.accountId, input }),
      };
    },
  },
  {
    method: "GET",
    path: "/api/v1/experts/me/bookings",
    access: ["expert"],
    operation: "listExpertBookings",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.bookingService.listForExpert({ accountId: ctx.claims.accountId }) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/experts/me/bookings/{bookingId}",
    access: ["expert"],
    operation: "updateBookingStatus",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(updateBookingStatusSchema, ctx.body);

      const data = await ctx.deps.bookingService.setStatus({
        accountId: ctx.claims.accountId,
        bookingId: ctx.params.bookingId,
        status: input.status,
      });

      return { data, message: `Booking marked as ${input.status}.` };
    },
  },

  // ------------------------------------------------------- public profile
  {
    // Declared last: `/experts/me*` routes above must win, and a route template
    // matches on segment count, so a literal is never mistaken for an id.
    method: "GET",
    path: "/api/v1/experts/{expertId}",
    access: "public",
    operation: "getPublicExpert",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.expertProfileService.publicProfile({ expertId: ctx.params.expertId }) };
    },
  },
];

export default routes;
