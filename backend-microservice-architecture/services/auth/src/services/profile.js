import { badRequestError, notFoundError } from "@lifebookz/shared-errors";

import { publicAccount } from "./registration.js";

/**
 * Account-scoped profile operations.
 *
 * Roles share one identity document, so name/avatar/cover edits are the same
 * operation for a reader, an author and an expert. The author's *professional*
 * profile lives in Story and the expert's in Consultation — see
 * ARCHITECTURE-MAPPING.md for why.
 */
const READER_MEDIA_KINDS = ["userAvatar", "userCover", "userCoverMobile"];

export function createProfileService({ accounts, sessions, mediaStore, publisher, logger }) {
  return {
    async me({ accountId }) {
      const account = await accounts.findById(accountId);

      if (!account) throw notFoundError("Account not found.");

      return publicAccount(account);
    },

    async updateMe({ accountId, input }) {
      const account = await accounts.findById(accountId);

      if (!account) throw notFoundError("Account not found.");

      const updated = await accounts.updateProfile(accountId, input);

      // Identity changed: Story, Consultation, Notification and System all keep
      // a read-model projection of the display name and avatar.
      await publisher?.publishSafely({
        type: "AccountProfileUpdated",
        data: {
          accountId: String(accountId),
          role: account.role,
          fullName: updated.fullName,
          username: updated.username,
          // The `{url, key}` object, not just the url: consumers keep it as the
          // account's avatar reference and would otherwise never refresh.
          avatar: updated.avatar?.url ? { url: updated.avatar.url, key: updated.avatar.key || "" } : null,
        },
        actor: { accountId: String(accountId), role: account.role },
      });

      return publicAccount(updated);
    },

    /** Public reader profile — the `GET /users/:userId` endpoint. */
    async publicProfile({ userId }) {
      const account = await accounts.findPublicById(userId);

      if (!account) throw notFoundError("User not found.");

      return { ...account, id: String(account._id), role: "user" };
    },

    /**
     * Account deletion.
     *
     * Soft delete (status `deleted`) instead of a hard delete, so stories and
     * bookings keep a resolvable author/expert reference and the profile page
     * can answer "this account is gone" instead of 404-ing on every join. Every
     * session is revoked and the token version bumped, which is what actually
     * ends access.
     */
    async deleteMe({ accountId }) {
      const account = await accounts.findById(accountId);

      if (!account) throw notFoundError("Account not found.");

      await accounts.softDelete(accountId);
      await sessions.revokeAllForAccount(accountId, "account-deleted");

      await publisher?.publishSafely({
        type: "AccountStatusChanged",
        data: { accountId: String(accountId), role: account.role, status: "deleted" },
        actor: { accountId: String(accountId), role: account.role },
      });

      logger?.info?.("Account deleted", { accountId: String(accountId), role: account.role });

      return { deleted: true };
    },

    /**
     * Presigned profile-media upload.
     *
     * The client uploads straight to Cloudflare R2; the file never passes
     * through Lambda or API Gateway. Only reader folders are allowed here —
     * author and expert media are presigned by the services that own those
     * profiles, so a reader token cannot write into `authors/`.
     */
    async presignMedia({ accountId, input }) {
      if (!READER_MEDIA_KINDS.includes(input.kind)) {
        throw badRequestError(
          `Only ${READER_MEDIA_KINDS.join(", ")} can be presigned here.`,
        );
      }

      return mediaStore.presignUpload({ ...input, accountId });
    },
  };
}
