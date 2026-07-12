import mongoose from 'mongoose';


const issueSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['hate_speech', 'legal', 'harassment', 'violence', 'nsfw', 'spam'], required: true },
    severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
    description: { type: String, required: true },
    suggestion: { type: String, default: '' },
  },
  { _id: false },
);

const verificationSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'issues_found', 'final'],
      default: 'pending',
      index: true,
    },
    issues: { type: [issueSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
  },
);

verificationSchema.index({ status: 1, createdAt: -1 });

const Verification = mongoose.model('verifications', verificationSchema);
export default Verification;
