/**
 * Consultation's inbound event handlers.
 *
 * Consultation keeps a projection of the expert's account identity and
 * verification state. It is the only way it can render an expert card, decide
 * who counts as "approved", or address a booking email, without reading Auth's
 * MongoDB cluster — the rule the whole architecture is built around.
 *
 * Only `role === "expert"` events are acted on; reader and author events are
 * acknowledged and ignored.
 */
export function createAccountEventHandlers({ expertProfiles, logger }) {
  return {
    async AccountRegistered(event) {
      const { accountId, role, email, username, fullName } = event.data;

      if (role !== "expert") return;

      const created = await expertProfiles.createFromAccount({ accountId, email, username, fullName });

      logger?.info?.("Expert projection created", { accountId, eventId: event.eventId, created });
    },

    async AccountProfileUpdated(event) {
      const { accountId, role, email, username, fullName, avatar } = event.data;

      if (role !== "expert") return;

      await expertProfiles.syncIdentity({ accountId, email, username, fullName, avatar: avatar || undefined });
    },

    async AccountVerificationDecided(event) {
      const { accountId, role, decision, reason } = event.data;

      if (role !== "expert") return;

      await expertProfiles.syncVerification({ accountId, status: decision, reason, verifiedAt: event.occurredAt });

      logger?.info?.("Expert verification projection synced", { accountId, decision, eventId: event.eventId });
    },

    async AccountStatusChanged(event) {
      const { accountId, role, status } = event.data;

      if (role !== "expert") return;

      await expertProfiles.syncAccountStatus({ accountId, status });
    },
  };
}
