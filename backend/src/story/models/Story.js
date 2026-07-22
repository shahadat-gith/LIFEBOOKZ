import mongoose from "mongoose";
import slugify from "slugify"; 

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

const statsSchema = new mongoose.Schema(
  {
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
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
      trim: true,
      maxlength: 150,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      index: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "processing", "verified", "published", "rejected"],
      default: "draft",
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: summarySchema,
      default: () => ({}),
    },
    stats: {
      type: statsSchema,
      default: () => ({}),
    },
    verification: {
      type: verificationSchema,
      default: () => ({}),
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true }
  }
);

// --- Indexes ---
storySchema.index({ status: 1, updatedAt: -1 });
storySchema.index({ publishedAt: -1 });
storySchema.index({ author: 1, status: 1, updatedAt: -1 });

// Text search weighting title matches higher than body content
storySchema.index(
  { title: "text", content: "text" },
  { weights: { title: 3, content: 1 }, name: "story_search_index" }
);

// --- Pre-Save Hooks ---
storySchema.pre("save", function (next) {
  // 1. Auto-generate title from content if empty
  if (!this.title || !this.title.trim()) {
    const plain = this.content.replace(/<[^>]*>/g, "").trim();
    this.title = plain.length > 100
      ? plain.slice(0, 100).replace(/\s+\S*$/, "") + "..."
      : plain || "Untitled Story";
  }

  // 2. Generate slug on new titles or modifications
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  // 3. Automate publishedAt timestamp handling
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

const Story = mongoose.model("stories", storySchema);

export default Story;