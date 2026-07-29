import mongoose from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { imageSchema } from "../../shared/models/image.schema";


const issueSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    suggestion: { type: String, default: "", trim: true },
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
    canProceed: { type: Boolean, default: true },
    issues: { type: [issueSchema], default: [] },
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
    content: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const statsSchema = new mongoose.Schema(
  {
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
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

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      index: true,
    },

    coverImage: {
      type: imageSchema,
      default: null, // Default to null instead of an empty object
    },

    storyType: {
      type: String,
      enum: ["autobiography", "biography", "legend"],
      required: true,
    },

    language: {
      type: String,
      default: "en",
    },

    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "processing",
        "verified",
        "published",
        "rejected",
      ],
      default: "draft",
      index: true,
    },

    // Flexible container for raw TipTap editor state (editor.getJSON())
    document: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: { type: "doc", content: [] }, // Default empty TipTap document structure
    },

    summary: {
      type: summarySchema,
      default: () => ({}),
    },

    verification: {
      type: verificationSchema,
      default: () => ({}),
    },

    stats: {
      type: statsSchema,
      default: () => ({}),
    },

    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
storySchema.index({ author: 1, updatedAt: -1 });
storySchema.index({ status: 1, updatedAt: -1 });
storySchema.index({ storyType: 1, status: 1 });
storySchema.index({ publishedAt: -1 });

// Hooks
storySchema.pre("save", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    const baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true,
    });
    // Append a unique short suffix to avoid collision crashes on duplicate titles
    this.slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
  }

  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

const Story = mongoose.models.Story || mongoose.model("Story", storySchema);

export default Story;