import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    suggestion: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    canProceed: {
      type: Boolean,
      default: true,
    },

    issues: {
      type: [issueSchema],
      default: [],
    },
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    content: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "processing",
        "published",
        "rejected",
      ],
      default: "draft",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
    },

    summary: {
      type: summarySchema,
      default: () => ({}),
    },

    verification: {
      type: verificationSchema,
      default: () => ({}),
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    publishedAt: {
      type: Date,
    },
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
  }
);

storySchema.index({ status: 1, updatedAt: -1 });
storySchema.index({ publishedAt: -1 });
storySchema.index({ author: 1, status: 1, updatedAt: -1 });
storySchema.index({ title: "text", content: "text" });

const Story = mongoose.model("stories", storySchema);

export default Story;