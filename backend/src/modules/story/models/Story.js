import mongoose from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { imageSchema } from "../../../core/models/image.schema.js";

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

/** Photo / video / audio attached to a chapter or a story. */
const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["image", "video", "audio"],
      default: "image",
    },
    caption: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
  },
  { _id: false }
);

/**
 * Story Schema (nested inside a chapter) — a single memory, lesson,
 * achievement, experience, etc. Content is plain text (Facebook-style),
 * not rich JSON.
 */
const storySchema = new mongoose.Schema(
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

    // What kind of story this is (mockup "Choose Story Type")
    storyType: {
      type: String,
      enum: ["experience", "achievement", "challenge", "memory", "lesson", "other"],
      default: "experience",
    },

    // Plain text content — simple input, no rich editor
    content: {
      type: String,
      default: "",
      maxlength: 50000,
    },

    dateLabel: {
      // Free-form when it happened, e.g. "12 June 2022" or "Summer of 1995"
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    media: {
      type: [mediaSchema],
      default: [],
    },

    // Chapter-level override: a single story can be more private than
    // its chapter ("public" | "followers" | "private")
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Chapter Schema — a phase of life (Childhood, School Life, College Life…).
 * Each chapter holds multiple stories and its own media gallery, and has
 * its own visibility setting.
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

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    coverImage: {
      type: imageSchema,
      default: null,
    },

    // Chapter-level media gallery (multiple photos / videos / audio)
    media: {
      type: [mediaSchema],
      default: [],
    },

    // Who can see this chapter: "public" | "followers" | "private"
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "private",
    },

    stories: {
      type: [storySchema],
      default: [],
    },

    order: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const storyBookSchema = new mongoose.Schema(
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

    // Title of the whole life story / lifebook
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

    // Lifebook-level visibility: "public" | "followers" | "private"
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },

    language: {
      type: String,
      default: "English",
    },

    /**
     * Chapters — ordered phases of life. Each chapter contains multiple
     * stories, its own media gallery, and its own visibility.
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

    summary: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
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

// Virtual: total number of chapters
storyBookSchema.virtual("chapterCount").get(function () {
  return this.chapters ? this.chapters.length : 0;
});

// Virtual: total number of stories across all chapters
storyBookSchema.virtual("storyCount").get(function () {
  if (!this.chapters) return 0;
  return this.chapters.reduce((sum, ch) => sum + (ch.stories?.length || 0), 0);
});

// Compound Indexes for queries
storyBookSchema.index({ author: 1, updatedAt: -1 });
storyBookSchema.index({ author: 1, status: 1, updatedAt: -1 });
storyBookSchema.index({ status: 1, visibility: 1, publishedAt: -1 });
storyBookSchema.index({ status: 1, "stats.likes": -1, publishedAt: -1 });
storyBookSchema.index({ status: 1, authorProfession: 1, publishedAt: -1 });
storyBookSchema.index({ status: 1, language: 1, publishedAt: -1 });
storyBookSchema.index({ featured: 1, publishedAt: -1 });

// Middleware
storyBookSchema.pre("save", function () {
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

const Story =
  mongoose.models.Story || mongoose.model("Story", storyBookSchema);

export default Story;
