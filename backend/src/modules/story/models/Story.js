import mongoose from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { imageSchema } from "../../../core/models/image.schema.js";

const analysisSchema = new mongoose.Schema(
  {
    canProceed: {
      type: Boolean,
      default: true,
    },
    issues: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        suggestedChange: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
    analyzedAt: {
      type: Date,
      default: null,
    },
    model: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const processingSchema = new mongoose.Schema(
  {
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    retries: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentStep: {
      type: String,
      enum: ["idle", "analysis", "enrichment", "embedding", "completed"],
      default: null,
    },
    error: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const statsSchema = new mongoose.Schema(
  {
    views: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    bookmarks: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

/**
 * Chapter Schema — each chapter is a self-contained section of the story
 */
const chapterSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    bannerImage: {
      type: imageSchema,
      default: null,
    },
    caption: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: () => ({ type: "doc", content: [] }),
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },

    // Denormalized for filtering
    authorProfession: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
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
    },

    coverImage: {
      type: imageSchema,
      default: null,
    },

    storyType: {
      type: String,
      enum: ["autobiography", "biography", "memoir", "legend"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "analyzing",
        "verified",
        "enriching",
        "enriched",
        "published",
        "rejected",
        "failed",
      ],
      default: "draft",
    },

    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },

    language: {
      type: String,
      default: "English",
    },

    /**
     * Chapters — ordered array of story chapters.
     * Each chapter has its own title, banner image, caption, and TipTap content.
     */
    chapters: {
      type: [chapterSchema],
      default: [],
      validate: {
        validator: function (chapters) {
          // Ensure order values are sequential starting from 0
          return chapters.every((ch, idx) => ch.order === idx);
        },
        message: "Chapter orders must be sequential starting from 0.",
      },
    },

    /**
     * Legacy content field — kept for backward compatibility.
     * New stories use chapters[] exclusively.
     */
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ type: "doc", content: [] }),
    },

    summary: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    // AI generated for story search & embeddings
    embeddingMetadata: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    analysis: {
      type: analysisSchema,
      default: () => ({}),
    },

    processing: {
      type: processingSchema,
      default: () => ({ currentStep: "idle" }),
    },

    stats: {
      type: statsSchema,
      default: () => ({}),
    },

    recentLikers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        fullName: String,
        avatar: String,
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
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

// Virtual: compute total chapter count
storySchema.virtual("chapterCount").get(function () {
  return this.chapters ? this.chapters.length : 0;
});

// Compound Indexes for queries
storySchema.index({ author: 1, updatedAt: -1 });
storySchema.index({ author: 1, status: 1, updatedAt: -1 });
storySchema.index({ status: 1, visibility: 1, publishedAt: -1 });
storySchema.index({ status: 1, visibility: 1, "stats.likes": -1, publishedAt: -1 });
storySchema.index({ status: 1, storyType: 1, publishedAt: -1 });
storySchema.index({ status: 1, authorProfession: 1, publishedAt: -1 });
storySchema.index({ status: 1, language: 1, publishedAt: -1 });
storySchema.index({ featured: 1, publishedAt: -1 });

// Middleware
storySchema.pre("save", function () {
  // Generate slug only once when title exists
  if (this.title && (!this.slug || this.isModified("title"))) {
    const baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true,
    });

    this.slug = `${baseSlug}-${nanoid(8)}`;
  }

  // Set first publish timestamp
  if (
    this.isModified("status") && this.status === "published" && !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
});

const Story = mongoose.models.Story || mongoose.model("Story", storySchema);

export default Story;
