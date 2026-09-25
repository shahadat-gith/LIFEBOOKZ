/**
 * System's inbound event handlers.
 *
 * System maintains read models only: the review queue (author/expert
 * applications) and the audit trail. It never writes to another service's
 * cluster; the approve/reject decision itself is executed by Auth over the
 * internal endpoint when an admin acts.
 */
export function createSystemEventHandlers({ reviewQueue, auditLogs, logger }) {
  return {
    async AuthorProfileSubmitted(event) {
      const { accountId, fullName, profession } = event.data;

      await reviewQueue.upsertSubmitted({
        accountId,
        role: "author",
        fullName,
        summary: { profession: profession || "", expertise: "", categories: [] },
        submittedAt: event.occurredAt,
      });

      logger?.info?.("Author application queued for review", { accountId, eventId: event.eventId });
    },

    async ExpertProfileSubmitted(event) {
      const { accountId, fullName, expertise, categories } = event.data;

      await reviewQueue.upsertSubmitted({
        accountId,
        role: "expert",
        fullName,
        summary: { profession: "", expertise: expertise || "", categories: categories || [] },
        submittedAt: event.occurredAt,
      });

      logger?.info?.("Expert application queued for review", { accountId, eventId: event.eventId });
    },

    async AccountVerificationDecided(event) {
      const { accountId, role, decision, reason } = event.data;

      if (role !== "author" && role !== "expert") return;

      await reviewQueue.syncVerification({
        accountId,
        status: decision,
        reason,
        verifiedAt: event.occurredAt,
      });

      logger?.info?.("Review queue verification synced", { accountId, role, decision });
    },

    async AccountRegistered(event) {
      const { accountId, role, email, username, fullName } = event.data;

      if (role !== "author" && role !== "expert") return;

      // Pre-create the queue row so the admin sees the (incomplete)
      // application as soon as the account exists.
      await reviewQueue.upsertSubmitted({
        accountId,
        role,
        email,
        username,
        fullName,
        summary: { profession: "", expertise: "", categories: [] },
        submittedAt: event.occurredAt,
      });
    },

    async AccountProfileUpdated(event) {
      const { accountId, role, email, username, fullName } = event.data;

      if (role !== "author" && role !== "expert") return;

      await reviewQueue.syncIdentity({ accountId, role, email, username, fullName });
    },

    async PrivilegedLoginRecorded(event) {
      const { role, email, outcome, ip } = event.data;

      await auditLogs.record({
        action: "auth.privileged-login",
        actorRole: role === "developer" ? "developer" : "admin",
        actorId: email || "",
        targetType: "session",
        outcome: outcome === "failed" ? "failure" : "success",
        detail: { role },
        ip: ip || "",
      });
    },
  };
}
