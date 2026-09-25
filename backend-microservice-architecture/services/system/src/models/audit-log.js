import mongoose from "mongoose";

/**
 * AuditLog — who did what, for privileged actions.
 *
 * Every admin decision (approve/reject) and every privileged login is written
 * here by System itself. This is the collection the developer portal's
 * "logs" view reads; the monolith kept an equivalent `log.model.js`.
 *
 * Deliberately append-only in usage: nothing in this architecture updates or
 * deletes audit rows (the developer's "clear logs" housekeeping from the
 * monolith is intentionally dropped — privileged audit trails do not get
 * cleared from inside the product).
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    // admin | developer | system
    actorRole: { type: String, enum: ["admin", "developer", "system"], default: "admin" },
    actorId: { type: String, default: "" },
    // What the action touched.
    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    outcome: { type: String, enum: ["success", "failure"], default: "success", index: true },
    detail: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorRole: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
