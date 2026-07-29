import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
);

const statsSchema = new mongoose.Schema(
  {
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    comments: {
      type: Number,
      default: 0,
      min: 0,
    },

    shares: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
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
      type: imageSchema,
      default: () => ({}),
    },

    storyType: {
      type: String,
      enum: ["autobiography", "biography", "legend"],
      required: true,
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

    content: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      enum: [
        "English",
        "Hindi",
        "Bengali",
        "Assamese",
        "Tamil",
        "Telugu",
        "Marathi",
        "Gujarati",
        "Kannada",
        "Malayalam",
        "Punjabi",
        "Urdu",
        "Odia",
        "Sanskrit",
        "French",
        "Spanish",
        "German",
        "Italian",
        "Portuguese",
        "Russian",
        "Chinese",
        "Japanese",
        "Korean",
        "Arabic",
        "Turkish",
        "Persian",
      ],
      default: "English",
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

    isFeatured: {
      type: Boolean,
      default: false,
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
        ret.id = ret._id;

        delete ret._id;
        delete ret.__v;

        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  },
);

// Indexes
storySchema.index({ status: 1, updatedAt: -1 });
storySchema.index({ publishedAt: -1 });
storySchema.index({ author: 1, status: 1, updatedAt: -1 });
storySchema.index({ storyType: 1, status: 1 });
storySchema.index({ isFeatured: 1, publishedAt: -1 });

storySchema.index({
  title: "text",
  content: "text",
});

// Generate slug from title if no slug exists
storySchema.pre("save", function (next) {
  // Generate slug from title if not set and title exists
  if (this.title?.trim() && (!this.slug || this.isModified("title"))) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true,
    });
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
