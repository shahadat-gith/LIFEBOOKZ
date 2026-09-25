import { authenticationError, notFoundError, upstreamError, validationError } from "@lifebookz/shared-errors";

/**
 * Admin operations.
 *
 * The monolith's admin module approved/rejected authors and experts directly
 * against the Author/Expert/User collections. In the new architecture:
 *   - the review *lists* come from System's own read model (event-fed);
 *   - the approve/reject *decision* is executed by Auth (which owns the
 *     verification state), called through an authenticated internal endpoint;
 *   - System records the decision in its audit log and publishes
 *     `AdminActionRecorded` for the audit trail.
 */
export function createAdminService({ reviewQueue, auditLogs, publisher, authClient, adminIdentity, logger }) {
  return {
    async me() {
      return adminIdentity();
    },

    async dashboard() {
      const counts = await reviewQueue.counts();

      return {
        ...counts,
        // Story/consultation totals live in those services' clusters; the
        // dashboard links out instead of denormalizing volatile counters.
      };
    },

    async pendingAuthors() {
      return reviewQueue.listByStatus("author", "pending");
    },

    async approvedAuthors() {
      return reviewQueue.listByStatus("author", "approved");
    },

    async pendingExperts() {
      return reviewQueue.listByStatus("expert", "pending");
    },

    async approvedExperts() {
      return reviewQueue.listByStatus("expert", "approved");
    },

    /**
     * Approve/reject an author or expert application.
     *
     * Auth executes the decision (it owns verification) and the welcome/
     * rejection email follows from its `AccountVerificationDecided` event →
     * Notification → email queue. This call only coordinates and audits.
     */
    async decideVerification({ accountId, role, decision, reason, actor, ip }) {
      if (decision === "rejected" && !String(reason || "").trim()) {
        throw validationError("Rejection reason is required.", { fields: { reason: "Rejection reason is required." } });
      }

      let result;

      try {
        result = await authClient.decideVerification({ accountId, decision, reason, decidedBy: actor.actorId });
      } catch (error) {
        await auditLogs.record({
          action: `${role}.verification.${decision}`,
          actorRole: "admin",
          actorId: actor.actorId,
          targetType: "account",
          targetId: String(accountId),
          outcome: "failure",
          detail: { reason: error.message, decision },
          ip,
        });

        if (error?.statusCode === 404) throw notFoundError(`${role === "author" ? "Author" : "Expert"} not found.`);

        throw upstreamError(`The decision could not be recorded: ${error.message}`);
      }

      await auditLogs.record({
        action: `${role}.verification.${decision}`,
        actorRole: "admin",
        actorId: actor.actorId,
        targetType: "account",
        targetId: String(accountId),
        outcome: "success",
        detail: { decision, reason: decision === "rejected" ? reason : undefined },
        ip,
      });

      await publisher?.publishSafely({
        type: "AdminActionRecorded",
        data: { action: `${role}.verification.${decision}`, targetType: "account", targetId: String(accountId), decision },
        actor,
      });

      logger?.info?.("Verification decided", { accountId: String(accountId), role, decision });

      return result;
    },
  };
}

/**
 * HTTP client for Auth's internal verification endpoint.
 *
 * Kept tiny and injected, so tests stub it. The service token is the shared
 * `INTERNAL_SERVICE_TOKEN` — the same secret Auth uses to authenticate the call.
 */
export function createAuthClient({ baseUrl, token, logger } = {}) {
  async function decideVerification({ accountId, decision, reason, decidedBy }) {
    if (!baseUrl) throw upstreamError("AUTH_API_BASE_URL is not configured.");

    const response = await fetch(`${baseUrl}/api/v1/internal/accounts/${encodeURIComponent(accountId)}/verification`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-lifebookz-service-token": token,
        "x-lifebookz-admin-id": decidedBy || "admin",
      },
      body: JSON.stringify({ decision, reason }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const error = new Error(`Auth returned ${response.status}: ${body.slice(0, 200)}`);
      error.statusCode = response.status;

      if (response.status === 401 || response.status === 403) {
        throw authenticationError("Service authentication with the Auth service failed.");
      }

      throw error;
    }

    return response.json().catch(() => ({}));
  }

  return { decideVerification, logger };
}
