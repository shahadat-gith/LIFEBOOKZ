import { authorizationError, forbiddenError, notFoundError, validationError } from "@lifebookz/shared-errors";

import { modelForRole } from "../repositories/engagement.js";

const MAX_COMMENT_LENGTH = 5000;

/**
 * Engagement: likes, comments (with author replies and comment likes) and
 * follows.
 *
 * All authorization is decided here — API Gateway only established *who* the
 * caller is. Counters live on the lifebook (for the feed) and on the author
 * profile projection (for the profile page), exactly like the monolith.
 */
export function createEngagementService({ lifebooks, authorProfiles, engagement, publisher, logger }) {
  async function requireStory(storyId) {
    const lifebook = await lifebooks.findById(storyId);

    if (!lifebook) throw notFoundError("Story not found.");

    return lifebook;
  }

  return {
    // ------------------------------------------------------------------ likes
    async toggleLike({ storyId, claims }) {
      const lifebook = await requireStory(storyId);
      const accountId = claims.accountId;
      const accountModel = modelForRole(claims.role);

      if (lifebook.status !== "published") {
        throw forbiddenError("You can only like published stories.");
      }

      const existing = await engagement.findLike({ storyId, accountId });

      if (existing) {
        await engagement.deleteLike({ storyId, accountId });
        await lifebooks.incrementStats({ storyId, likes: -1 });
        await lifebooks.removeRecentLiker({ storyId, accountId });
        await authorProfiles.incrementStats(lifebook.author, { likes: -1 });

        await publisher?.publishSafely({
          type: "StoryUnliked",
          data: { storyId: String(storyId), authorId: String(lifebook.author), liked: false },
          actor: claims,
        });

        return { liked: false };
      }

      await engagement.createLike({ storyId, accountId, accountModel });
      await lifebooks.incrementStats({ storyId, likes: 1 });
      // recentLikers is a display cache; the authoritative name comes from the
      // Notification service's AccountProjection.
      await lifebooks.pushRecentLiker({ storyId, liker: { account: accountId } });
      await authorProfiles.incrementStats(lifebook.author, { likes: 1 });

      await publisher?.publishSafely({
        type: "StoryLiked",
        // No actor display fields on purpose: Notification resolves the
        // actor's name/avatar from its own AccountProjection, so a renamed or
        // re-avatar'd account shows up on old notifications too.
        data: {
          storyId: String(storyId),
          authorId: String(lifebook.author),
          storyTitle: lifebook.title,
          storySlug: lifebook.slug,
          liked: true,
        },
        actor: claims,
      });

      return { liked: true };
    },

    async listLikes({ storyId }) {
      await requireStory(storyId);

      return engagement.listLikes(storyId);
    },

    // --------------------------------------------------------------- comments
    async createComment({ storyId, claims, content }) {
      const lifebook = await requireStory(storyId);
      const text = String(content || "").trim();

      if (!text) {
        throw validationError("Write something before posting.", { fields: { content: "Write something before posting." } });
      }
      if (text.length > MAX_COMMENT_LENGTH) {
        throw validationError(`Comments are limited to ${MAX_COMMENT_LENGTH} characters.`, {
          fields: { content: `Comments are limited to ${MAX_COMMENT_LENGTH} characters.` },
        });
      }

      const comment = await engagement.createComment({
        storyId,
        accountId: claims.accountId,
        accountModel: modelForRole(claims.role),
        content: text,
      });

      await lifebooks.incrementStats({ storyId, comments: 1 });

      await publisher?.publishSafely({
        type: "CommentCreated",
        data: {
          storyId: String(storyId),
          commentId: String(comment.id || comment._id),
          authorId: String(lifebook.author),
          storyTitle: lifebook.title,
          storySlug: lifebook.slug,
          preview: text.slice(0, 200),
        },
        actor: claims,
      });

      return comment;
    },

    async listComments({ storyId, claims, page, limit }) {
      await requireStory(storyId);

      const result = await engagement.listComments({ storyId, page, limit });

      return {
        ...result,
        items: result.items.map((comment) => ({
          ...comment,
          id: String(comment._id),
          isOwn: Boolean(claims?.accountId) && String(comment.account) === String(claims.accountId),
          likedByMe: Boolean(
            claims?.accountId && (comment.likes || []).some((like) => String(like.account) === String(claims.accountId)),
          ),
          likeCount: (comment.likes || []).length,
        })),
      };
    },

    async updateComment({ commentId, claims, content }) {
      const comment = await engagement.findCommentById(commentId);

      if (!comment) throw notFoundError("Comment not found.");

      if (String(comment.account) !== String(claims.accountId)) {
        throw authorizationError("You can only edit your own comment.");
      }

      const text = String(content || "").trim();
      if (!text) {
        throw validationError("Write something before saving.", { fields: { content: "Write something before saving." } });
      }

      comment.content = text.slice(0, MAX_COMMENT_LENGTH);
      comment.edited = true;
      await comment.save();

      await publisher?.publishSafely({
        type: "CommentUpdated",
        data: { commentId: String(commentId), storyId: String(comment.story) },
        actor: claims,
      });

      return comment.toJSON();
    },

    /** The comment's author, the story's author, or an admin may delete. */
    async deleteComment({ commentId, claims }) {
      const comment = await engagement.findCommentById(commentId);

      if (!comment) throw notFoundError("Comment not found.");

      const lifebook = await lifebooks.findById(comment.story);
      const isCommentOwner = String(comment.account) === String(claims.accountId);
      const isStoryOwner = lifebook && String(lifebook.author) === String(claims.accountId);
      const isAdmin = claims.role === "admin";

      if (!isCommentOwner && !isStoryOwner && !isAdmin) {
        throw authorizationError("You cannot delete this comment.");
      }

      await comment.deleteOne();
      await lifebooks.incrementStats({ storyId: comment.story, comments: -1 });

      await publisher?.publishSafely({
        type: "CommentDeleted",
        data: { commentId: String(commentId), storyId: String(comment.story), authorId: lifebook ? String(lifebook.author) : null },
        actor: claims,
      });

      return { deleted: true };
    },

    async toggleCommentLike({ commentId, claims }) {
      const comment = await engagement.findCommentById(commentId);

      if (!comment) throw notFoundError("Comment not found.");

      const index = (comment.likes || []).findIndex((like) => String(like.account) === String(claims.accountId));

      if (index >= 0) comment.likes.splice(index, 1);
      else comment.likes.push({ account: claims.accountId, accountModel: modelForRole(claims.role) });

      await comment.save();

      await publisher?.publishSafely({
        type: "CommentLiked",
        data: { commentId: String(commentId), storyId: String(comment.story), liked: index < 0 },
        actor: claims,
      });

      return { liked: index < 0, likeCount: comment.likes.length };
    },

    /** Replies are the story author's privilege, as in the monolith. */
    async replyToComment({ commentId, claims, content }) {
      const comment = await engagement.findCommentById(commentId);

      if (!comment) throw notFoundError("Comment not found.");

      const lifebook = await requireStory(comment.story);

      if (String(lifebook.author) !== String(claims.accountId)) {
        throw authorizationError("Only the story's author can reply to a comment.");
      }

      const text = String(content || "").trim();
      if (!text) {
        throw validationError("Write a reply before posting.", { fields: { content: "Write a reply before posting." } });
      }

      comment.replies.push({ author: claims.accountId, content: text.slice(0, MAX_COMMENT_LENGTH) });
      await comment.save();

      const reply = comment.replies.at(-1);

      await publisher?.publishSafely({
        type: "CommentReplyCreated",
        data: {
          storyId: String(comment.story),
          commentId: String(commentId),
          recipientAccountId: String(comment.account),
          recipientModel: comment.accountModel,
          replyId: String(reply._id),
          preview: text.slice(0, 200),
        },
        actor: claims,
      });

      return { id: String(reply._id), content: reply.content, author: String(reply.author) };
    },

    // ---------------------------------------------------------------- follows
    async follow({ authorId, claims }) {
      if (String(authorId) === String(claims.accountId)) {
        throw validationError("You cannot follow yourself.", { fields: { authorId: "You cannot follow yourself." } });
      }

      const profile = await authorProfiles.findById(authorId);

      if (!profile) throw notFoundError("Author not found.");

      const existing = await engagement.findFollow({ followerId: claims.accountId, authorId });

      if (existing) throw validationError("Already following this author.");

      await engagement.createFollow({
        followerId: claims.accountId,
        followerModel: modelForRole(claims.role),
        authorId,
      });

      await authorProfiles.incrementStats(authorId, { followers: 1 });
      await authorProfiles.incrementStats(claims.accountId, { following: 1 });

      await publisher?.publishSafely({
        type: "FollowCreated",
        data: {
          authorId: String(authorId),
          followerId: String(claims.accountId),
          followerModel: modelForRole(claims.role),
        },
        actor: claims,
      });

      return { following: true };
    },

    async unfollow({ authorId, claims }) {
      const deleted = await engagement.deleteFollow({ followerId: claims.accountId, authorId });

      if (!deleted) throw notFoundError("You are not following this author.");

      await authorProfiles.incrementStats(authorId, { followers: -1 });
      await authorProfiles.incrementStats(claims.accountId, { following: -1 });

      await publisher?.publishSafely({
        type: "FollowRemoved",
        data: { authorId: String(authorId), followerId: String(claims.accountId) },
        actor: claims,
      });

      return { following: false };
    },

    async isFollowing({ authorId, claims }) {
      if (!claims?.accountId) return { following: false };

      const follow = await engagement.findFollow({ followerId: claims.accountId, authorId });

      return { following: Boolean(follow) };
    },

    async followers({ authorId }) {
      const rows = await engagement.listFollowers(authorId);
      const profiles = await authorProfiles.findManyByIds(rows.map((row) => String(row.follower)));
      const byId = new Map(profiles.map((profile) => [String(profile._id), profile]));

      return rows.map((row) => ({
        id: String(row._id),
        since: row.createdAt,
        follower: byId.get(String(row.follower)) || { id: String(row.follower), fullName: "", avatar: {} },
        followerModel: row.followerModel,
      }));
    },

    async following({ accountId }) {
      const rows = await engagement.listFollowing(accountId);
      const profiles = await authorProfiles.findManyByIds(rows.map((row) => String(row.author)));
      const byId = new Map(profiles.map((profile) => [String(profile._id), profile]));

      return rows.map((row) => ({
        id: String(row._id),
        since: row.createdAt,
        author: byId.get(String(row.author)) || { id: String(row.author), fullName: "", avatar: {} },
      }));
    },

    /** Profile page counters: followers, following, chapters, stories, likes. */
    async myStats({ accountId }) {
      const [followers, following, books] = await Promise.all([
        engagement.countFollowers(accountId),
        engagement.countFollowing(accountId),
        lifebooks.aggregateAuthorStats(accountId),
      ]);

      return { followers, following, chapters: books.chapters, stories: books.stories, likes: books.likes };
    },
  };
}
