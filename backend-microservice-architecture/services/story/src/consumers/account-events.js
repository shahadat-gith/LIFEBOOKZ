/**
 * Story's inbound event handlers.
 *
 * Story keeps a deliberate read-model projection of the Auth account
 * (display name, avatar, verification, status). Keeping it here — instead of
 * reading the Auth cluster — is what lets the feed render a card without a
 * cross-service query, and it is the only kind of duplication the
 * architecture allows.
 */
export function createAccountEventHandlers({ authorProfiles, lifebooks, logger }) {
  return {
    async AccountRegistered(event) {
      const { accountId, role, email, username, fullName } = event.data;

      if (role !== "author") return;

      await authorProfiles.createFromAccount({ accountId, email, username, fullName, role });
      logger?.info?.("Author projection created", { accountId, eventId: event.eventId });
    },

    async AccountProfileUpdated(event) {
      const { accountId, role, fullName, username, avatar } = event.data;

      if (role !== "author") return;

      const updated = await authorProfiles.syncIdentity({ accountId, fullName, username, avatar: avatar || undefined });

      // Keep the searchable, denormalised name/profession in step as well.
      if (updated) {
        await lifebooks.updateAuthorProfession({ authorId: accountId, profession: updated.profession });
      }
    },

    async AccountVerificationDecided(event) {
      const { accountId, role, decision, reason } = event.data;

      if (role !== "author") return;

      await authorProfiles.syncVerification({ accountId, status: decision, reason, verifiedAt: event.occurredAt });
      logger?.info?.("Author verification projection synced", { accountId, decision });
    },

    async AccountStatusChanged(event) {
      const { accountId, role, status } = event.data;

      if (role !== "author") return;

      await authorProfiles.syncAccountStatus({ accountId, status });
    },
  };
}
