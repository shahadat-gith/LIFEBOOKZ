import { randomUUID } from "node:crypto";

import mongoose from "mongoose";

/**
 * Lifebook — the life story document.
 *
 * Structure is taken from the existing backend (the *current* design, after
 * chapters were slimmed down): a lifebook has a title + banner image, holds
 * chapters, and each chapter holds one or more **story entries**. Text, media
 * and visibility live on the story entry; a chapter is only an ordered
 * container with a title.
 */
export const CHAPTER_NAMES = [
  "Childhood",
  "School Life",
  "College Life",
  "Relationship / Love Life",
  "Career",
  "Marriage",
  "Family",
];

export const STORY_TYPES = ["experience", "achievement", "challenge", "memory", "lesson", "other"];
export const VISIBILITIES = ["public", "followers", "private"];
export const LIFESTORY_STATUSES = ["draft", "published"];

export function chapterName(order) {
  const index = Number(order);

  return CHAPTER_NAMES[index] || `Chapter ${index + 1}`;
}

/** Public slug prefixed by a short random suffix so links never collide. */
export function buildSlug(title) {
  const base = String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${base || "lifebook"}-${randomUUID().slice(0, 8)}`;
}

const imageSchema = new mongoose.Schema(
  { url: { type: String, default: "", trim: true }, key: { type: String, default: "", trim: true } },
  { _id: false },
);

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    key: { type: String, trim: true, default: "" },
    type: { type: String, enum: ["image", "video"], default: "image" },
    caption: { type: String, trim: true, default: "", maxlength: 300 },
  },
  { _id: false },
);

const entrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    storyType: { type: String, enum: STORY_TYPES, default: "experience" },
    content: { type: String, default: "", maxlength: 50000 },
    dateLabel: { type: String, trim: true, default: "", maxlength: 100 },
    location: { type: String, trim: true, default: "", maxlength: 150 },
    media: { type: [mediaSchema], default: [] },
    // Visibility is per story entry (the monolith moved it here deliberately).
    visibility: { type: String, enum: VISIBILITIES, default: "public" },
    status: { type: String, enum: LIFESTORY_STATUSES, default: "draft" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    stories: { type: [entrySchema], default: [] },
    order: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

const lifebookSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    // Denormalised on purpose: the feed filters by the author's profession and
    // that value belongs to this service's AuthorProfile projection.
    authorProfession: { type: String, trim: true, lowercase: true, default: null },

    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, sparse: true, lowercase: true },

    bannerImage: { type: imageSchema, default: null },
    visibility: { type: String, enum: VISIBILITIES, default: "public" },
    language: { type: String, default: "English" },

    chapters: {
      type: [chapterSchema],
      default: [],
      validate: {
        validator: (chapters) => new Set(chapters.map((chapter) => chapter.order)).size === chapters.length,
        message: "Every chapter must sit in its own slot.",
      },
    },

    status: { type: String, enum: LIFESTORY_STATUSES, default: "draft" },

    stats: {
      type: new mongoose.Schema(
        {
          views: { type: Number, default: 0, min: 0 },
          likes: { type: Number, default: 0, min: 0 },
          comments: { type: Number, default: 0, min: 0 },
          shares: { type: Number, default: 0, min: 0 },
          bookmarks: { type: Number, default: 0, min: 0 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    /** Last few likers, shown on feed cards without a second query. */
    recentLikers: [
      {
        _id: false,
        account: { type: mongoose.Schema.Types.ObjectId },
        fullName: { type: String, default: "" },
        avatar: { type: String, default: "" },
      },
    ],

    featured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
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
    toObject: { virtuals: true },
  },
);

lifebookSchema.virtual("chapterCount").get(function chapterCount() {
  return this.chapters ? this.chapters.length : 0;
});

lifebookSchema.virtual("storyCount").get(function storyCount() {
  return (this.chapters || []).reduce((total, chapter) => total + (chapter.stories?.length || 0), 0);
});

lifebookSchema.index({ author: 1, updatedAt: -1 });
lifebookSchema.index({ author: 1, status: 1, updatedAt: -1 });
lifebookSchema.index({ status: 1, visibility: 1, publishedAt: -1 });
lifebookSchema.index({ status: 1, "stats.likes": -1, publishedAt: -1 });
lifebookSchema.index({ status: 1, authorProfession: 1, publishedAt: -1 });
lifebookSchema.index({ status: 1, language: 1, publishedAt: -1 });
lifebookSchema.index({ featured: 1, publishedAt: -1 });

/** Text search over titles is done with regexes (as in the monolith). */
lifebookSchema.index({ title: "text" });

lifebookSchema.pre("save", function prepare() {
  if (Array.isArray(this.chapters) && this.chapters.length > 1) {
    this.chapters.sort((a, b) => a.order - b.order);
  }

  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = buildSlug(this.title);
  }

  // First publication only — re-publishing keeps the original date.
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

export const Lifebook = mongoose.models.Lifebook || mongoose.model("Lifebook", lifebookSchema);

export default Lifebook;
