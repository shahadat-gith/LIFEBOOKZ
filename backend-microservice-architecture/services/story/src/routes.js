import { validate } from "@lifebookz/shared-validation";

import {
  authorPresignSchema,
  authorProfileSchema,
  chapterSchema,
  commentSchema,
  createLifebookSchema,
  entrySchema,
  feedQuerySchema,
  mediaReferenceSchema,
  moderationSchema,
  paginationSchema,
  searchQuerySchema,
  storyPresignSchema,
  testimonialSchema,
  updateChapterSchema,
  updateEntrySchema,
  updateLifebookSchema,
} from "./validators.js";

/**
 * Story's routes.
 *
 * Route shapes mirror the existing backend (`/stories`, `/authors`,
 * `/following`, `/search`, `/testimonials`) so the frontends keep their paths.
 * `access` is enforced twice: by the API Gateway authorizer and again in the
 * router (defence in depth), and the *resource* decision is made by the domain
 * services.
 */
const ACCOUNT_ROLES = ["user", "author", "expert"];

export const routes = [
  // -------------------------------------------------------------- lifebooks
  {
    method: "POST",
    path: "/api/v1/stories",
    access: ["author"],
    operation: "createStory",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(createLifebookSchema, ctx.body);

      return { status: 201, data: await ctx.deps.lifebookService.create({ accountId: ctx.claims.accountId, claims: ctx.actor, input }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/stories",
    access: "public",
    operation: "listStories",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const query = validate(feedQuerySchema, ctx.query);

      return { data: await ctx.deps.lifebookService.feed({ query, claims: ctx.claims }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/stories/drafts",
    access: ["author"],
    operation: "listDrafts",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const query = validate(paginationSchema, ctx.query);

      return { data: await ctx.deps.lifebookService.drafts({ accountId: ctx.claims.accountId, ...query }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/stories/{storyId}",
    access: "public",
    operation: "getStory",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.lifebookService.detail({ storyId: ctx.params.storyId, claims: ctx.claims }) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/stories/{storyId}",
    access: ["author"],
    operation: "updateStory",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(updateLifebookSchema, ctx.body);

      return {
        data: await ctx.deps.lifebookService.update({
          accountId: ctx.claims.accountId,
          claims: ctx.actor,
          storyId: ctx.params.storyId,
          input,
        }),
      };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/stories/{storyId}",
    access: ["author"],
    operation: "deleteStory",
    handler: async (ctx) => {
      await ctx.deps.ready();

      await ctx.deps.lifebookService.remove({ accountId: ctx.claims.accountId, claims: ctx.actor, storyId: ctx.params.storyId });

      return { message: "Story deleted successfully." };
    },
  },
  {
    method: "POST",
    path: "/api/v1/stories/{storyId}/publish",
    access: ["author"],
    operation: "publishStory",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(updateLifebookSchema, ctx.body);

      const data = await ctx.deps.lifebookService.publish({
        accountId: ctx.claims.accountId,
        claims: ctx.actor,
        storyId: ctx.params.storyId,
        input,
      });

      return { data, message: "Story published successfully." };
    },
  },
  {
    method: "POST",
    path: "/api/v1/stories/{storyId}/unpublish",
    access: ["author"],
    operation: "unpublishStory",
    handler: async (ctx) => {
      await ctx.deps.ready();

      const data = await ctx.deps.lifebookService.unpublish({
        accountId: ctx.claims.accountId,
        claims: ctx.actor,
        storyId: ctx.params.storyId,
      });

      return { data, message: "Story unpublished." };
    },
  },

  // --------------------------------------------------------------- chapters
  {
    method: "POST",
    path: "/api/v1/stories/{storyId}/chapters",
    access: ["author"],
    operation: "addChapter",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(chapterSchema, ctx.body);

      return {
        status: 201,
        data: await ctx.deps.lifebookService.addChapter({
          accountId: ctx.claims.accountId,
          claims: ctx.actor,
          storyId: ctx.params.storyId,
          input,
        }),
      };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/stories/{storyId}/chapters/{chapterId}",
    access: ["author"],
    operation: "updateChapter",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(updateChapterSchema, ctx.body);

      return {
        data: await ctx.deps.lifebookService.updateChapter({
          accountId: ctx.claims.accountId,
          claims: ctx.actor,
          storyId: ctx.params.storyId,
          chapterId: ctx.params.chapterId,
          input,
        }),
      };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/stories/{storyId}/chapters/{chapterId}",
    access: ["author"],
    operation: "deleteChapter",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return {
        data: await ctx.deps.lifebookService.deleteChapter({
          accountId: ctx.claims.accountId,
          claims: ctx.actor,
          storyId: ctx.params.storyId,
          chapterId: ctx.params.chapterId,
        }),
      };
    },
  },

  // ---------------------------------------------------------- story entries
  {
    method: "POST",
    path: "/api/v1/stories/{storyId}/chapters/{chapterId}/stories",
    access: ["author"],
    operation: "addStoryEntry",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(entrySchema, ctx.body);

      return {
        status: 201,
        data: await ctx.deps.lifebookService.addEntry({
          accountId: ctx.claims.accountId,
          claims: ctx.actor,
          storyId: ctx.params.storyId,
          chapterId: ctx.params.chapterId,
          input,
        }),
      };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/stories/{storyId}/chapters/{chapterId}/stories/{entryId}",
    access: ["author"],
    operation: "updateStoryEntry",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(updateEntrySchema, ctx.body);

      return {
        data: await ctx.deps.lifebookService.updateEntry({
          accountId: ctx.claims.accountId,
          claims: ctx.actor,
          storyId: ctx.params.storyId,
          chapterId: ctx.params.chapterId,
          entryId: ctx.params.entryId,
          input,
        }),
      };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/stories/{storyId}/chapters/{chapterId}/stories/{entryId}",
    access: ["author"],
    operation: "deleteStoryEntry",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return {
        data: await ctx.deps.lifebookService.deleteEntry({
          accountId: ctx.claims.accountId,
          claims: ctx.actor,
          storyId: ctx.params.storyId,
          chapterId: ctx.params.chapterId,
          entryId: ctx.params.entryId,
        }),
      };
    },
  },

  // ----------------------------------------------------------------- media
  {
    method: "POST",
    path: "/api/v1/stories/media/presign",
    access: ["author"],
    operation: "presignStoryMedia",
    handler: async (ctx) => {
      const input = validate(storyPresignSchema, ctx.body);

      return { status: 201, data: await ctx.deps.lifebookService.presignMedia({ accountId: ctx.claims.accountId, input }) };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/stories/media",
    access: ["author"],
    operation: "deleteStoryMedia",
    handler: async (ctx) => {
      const input = validate(mediaReferenceSchema, ctx.body);

      return { data: await ctx.deps.lifebookService.deleteMedia({ accountId: ctx.claims.accountId, input }) };
    },
  },

  // ------------------------------------------------------------ engagement
  {
    method: "POST",
    path: "/api/v1/stories/{storyId}/like",
    access: ACCOUNT_ROLES,
    operation: "toggleLike",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.engagementService.toggleLike({ storyId: ctx.params.storyId, claims: ctx.actor }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/stories/{storyId}/comments",
    access: "public",
    operation: "listComments",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const query = validate(paginationSchema, ctx.query);

      return {
        data: await ctx.deps.engagementService.listComments({ storyId: ctx.params.storyId, claims: ctx.claims, ...query }),
      };
    },
  },
  {
    method: "POST",
    path: "/api/v1/stories/{storyId}/comments",
    access: ACCOUNT_ROLES,
    operation: "createComment",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(commentSchema, ctx.body);

      return {
        status: 201,
        data: await ctx.deps.engagementService.createComment({
          storyId: ctx.params.storyId,
          claims: ctx.actor,
          content: input.content,
        }),
      };
    },
  },
  {
    method: "POST",
    path: "/api/v1/stories/comments/{commentId}/like",
    access: ACCOUNT_ROLES,
    operation: "toggleCommentLike",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.engagementService.toggleCommentLike({ commentId: ctx.params.commentId, claims: ctx.actor }) };
    },
  },
  {
    method: "POST",
    path: "/api/v1/stories/comments/{commentId}/reply",
    access: ["author"],
    operation: "replyToComment",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(commentSchema, ctx.body);

      return {
        status: 201,
        data: await ctx.deps.engagementService.replyToComment({
          commentId: ctx.params.commentId,
          claims: ctx.actor,
          content: input.content,
        }),
      };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/stories/comments/{commentId}",
    access: ACCOUNT_ROLES,
    operation: "updateComment",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(commentSchema, ctx.body);

      return {
        data: await ctx.deps.engagementService.updateComment({
          commentId: ctx.params.commentId,
          claims: ctx.actor,
          content: input.content,
        }),
      };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/stories/comments/{commentId}",
    access: ACCOUNT_ROLES,
    operation: "deleteComment",
    handler: async (ctx) => {
      await ctx.deps.ready();

      await ctx.deps.engagementService.deleteComment({ commentId: ctx.params.commentId, claims: ctx.actor });

      return { message: "Comment deleted successfully." };
    },
  },

  // --------------------------------------------------------------- authors
  {
    method: "GET",
    path: "/api/v1/authors/approved",
    access: "public",
    operation: "listApprovedAuthors",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.authorProfileService.approvedAuthors() };
    },
  },
  {
    method: "GET",
    path: "/api/v1/authors/me",
    access: ["author"],
    operation: "getMyAuthorProfile",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.authorProfileService.mine({ accountId: ctx.claims.accountId }) };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/authors/me",
    access: ["author"],
    operation: "updateMyAuthorProfile",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(authorProfileSchema, ctx.body);

      return { data: await ctx.deps.authorProfileService.update({ accountId: ctx.claims.accountId, claims: ctx.actor, input }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/authors/me/stories",
    access: ["author"],
    operation: "listMyStories",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.lifebookService.mine({ accountId: ctx.claims.accountId }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/authors/me/stats",
    access: ["author"],
    operation: "getMyAuthorStats",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.engagementService.myStats({ accountId: ctx.claims.accountId }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/authors/me/stories/{storyId}",
    access: ["author"],
    operation: "getMyStory",
    handler: async (ctx) => {
      await ctx.deps.ready();

      const data = await ctx.deps.lifebookService.detail({ storyId: ctx.params.storyId, claims: ctx.claims });

      return { data };
    },
  },
  {
    method: "POST",
    path: "/api/v1/authors/me/media/presign",
    access: ["author"],
    operation: "presignAuthorMedia",
    handler: async (ctx) => {
      const input = validate(authorPresignSchema, ctx.body);

      return { status: 201, data: await ctx.deps.authorProfileService.presignMedia({ accountId: ctx.claims.accountId, input }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/authors/{authorId}",
    access: "public",
    operation: "getPublicAuthor",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.authorProfileService.publicProfile({ authorId: ctx.params.authorId, claims: ctx.claims }) };
    },
  },

  // ------------------------------------------------------------- following
  {
    method: "POST",
    path: "/api/v1/following/{authorId}/follow",
    access: ACCOUNT_ROLES,
    operation: "followAuthor",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { status: 201, data: await ctx.deps.engagementService.follow({ authorId: ctx.params.authorId, claims: ctx.actor }) };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/following/{authorId}/follow",
    access: ACCOUNT_ROLES,
    operation: "unfollowAuthor",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.engagementService.unfollow({ authorId: ctx.params.authorId, claims: ctx.actor }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/following/{authorId}/check",
    access: ACCOUNT_ROLES,
    operation: "checkFollow",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.engagementService.isFollowing({ authorId: ctx.params.authorId, claims: ctx.claims }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/following/{authorId}/followers",
    access: "public",
    operation: "getFollowers",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.engagementService.followers({ authorId: ctx.params.authorId }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/following/user/{userId}/following",
    access: "public",
    operation: "getFollowing",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.engagementService.following({ accountId: ctx.params.userId }) };
    },
  },

  // ---------------------------------------------------------------- search
  {
    method: "GET",
    path: "/api/v1/search",
    access: "public",
    operation: "searchStories",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const query = validate(searchQuerySchema, ctx.query);

      return { data: await ctx.deps.lifebookService.search({ query, claims: ctx.claims }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/search/professions",
    access: "public",
    operation: "listProfessions",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.lifebookService.professions() };
    },
  },

  // ----------------------------------------------------------- testimonials
  {
    method: "GET",
    path: "/api/v1/testimonials",
    access: "public",
    operation: "listTestimonials",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const query = validate(paginationSchema, ctx.query);

      return { data: await ctx.deps.testimonialService.list({ limit: query.limit }) };
    },
  },
  {
    method: "GET",
    path: "/api/v1/testimonials/me",
    access: ACCOUNT_ROLES,
    operation: "getMyTestimonial",
    handler: async (ctx) => {
      await ctx.deps.ready();

      return { data: await ctx.deps.testimonialService.mine({ accountId: ctx.claims.accountId, role: ctx.claims.role }) };
    },
  },
  {
    method: "POST",
    path: "/api/v1/testimonials",
    access: ACCOUNT_ROLES,
    operation: "createTestimonial",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(testimonialSchema, ctx.body);

      return {
        status: 201,
        data: await ctx.deps.testimonialService.create({ claims: ctx.actor, message: input.message, rating: input.rating }),
      };
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/testimonials/{id}",
    access: [...ACCOUNT_ROLES, "admin"],
    operation: "deleteTestimonial",
    handler: async (ctx) => {
      await ctx.deps.ready();

      await ctx.deps.testimonialService.remove({ id: ctx.params.id, claims: ctx.actor });

      return { message: "Testimonial deleted successfully." };
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/testimonials/{id}/status",
    access: ["admin"],
    operation: "moderateTestimonial",
    handler: async (ctx) => {
      await ctx.deps.ready();
      const input = validate(moderationSchema, ctx.body);

      return { data: await ctx.deps.testimonialService.moderate({ id: ctx.params.id, status: input.status, claims: ctx.actor }) };
    },
  },
];

export default routes;
