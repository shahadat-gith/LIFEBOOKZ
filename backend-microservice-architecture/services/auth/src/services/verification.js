import { notFoundError, validationError } from "@lifebookz/shared-errors";

/**
 * Application review decision (admin → account).
 *
 * The admin decides in the System service; the *state* belongs to the account,
 * so System calls this internal route with the service token. Auth then
 * publishes `AccountVerificationDecided`, which:
 *   - Notification consumes to email the applicant (approved / rejected with
 *     the reason) — the monolith sent that mail from the admin module;
 *   - Story / Consultation consume to update their verification projections;
 *   - System consumes to update its admin review read model.
 */
export function createVerificationService({ accounts, publisher, logger }) {
  return {
    async decide({ accountId, decision, reason, decidedBy }) {
      if (!["approved", "rejected"].includes(decision)) {
        throw validationError("Decision must be approved or rejected.", {
          fields: { decision: "Decision must be approved or rejected." },
        });
      }

      if (decision === "rejected" && !String(reason || "").trim()) {
        throw validationError("Rejection reason is required.", {
          fields: { reason: "Rejection reason is required." },
        });
      }

      const account = await accounts.findById(accountId);

      if (!account) throw notFoundError("Account not found.");

      const updated = await accounts.setVerification(accountId, {
        status: decision,
        reason: String(reason || "").trim(),
        decidedBy,
      });

      await publisher?.publishSafely({
        type: "AccountVerificationDecided",
        data: {
          accountId: String(accountId),
          role: account.role,
          decision,
          reason: decision === "rejected" ? String(reason).trim() : "",
          fullName: account.fullName,
          email: account.email,
        },
        actor: { accountId: String(decidedBy || "system"), role: "admin" },
      });

      logger?.info?.("Account verification decided", { accountId: String(accountId), decision, decidedBy });

      return {
        accountId: String(accountId),
        role: updated.role,
        verification: updated.verification,
      };
    },
  };
}
