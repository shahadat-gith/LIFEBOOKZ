import mongoose from "mongoose";

/**
 * One WebRTC signaling message between the two participants of a
 * consultation (offer / answer / ICE candidate).
 *
 * Delivered by REST polling (Lambda/API Gateway has no persistent sockets),
 * so messages are stored in MongoDB and expire quickly: a TTL index deletes
 * them after a few minutes, and clients only pull messages newer than the
 * last id they saw.
 */
const signalingMessageSchema = new mongoose.Schema(
  {
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
      index: true,
    },

    // "user" | "expert" — the sender.
    from: { type: String, enum: ["user", "expert"], required: true },
    // "user" | "expert" — the intended recipient.
    to: { type: String, enum: ["user", "expert"], required: true },

    type: {
      type: String,
      enum: ["offer", "answer", "ice", "bye"],
      required: true,
    },

    // Opaque SDP / ICE payload — never interpreted by the server.
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

signalingMessageSchema.index({ consultation: 1, createdAt: 1 });

// Auto-delete signaling traffic a few minutes after it is written.
signalingMessageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 300 },
);

const SignalingMessage =
  mongoose.models.SignalingMessage ||
  mongoose.model("SignalingMessage", signalingMessageSchema);

export default SignalingMessage;
