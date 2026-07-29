import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { imageSchema } from "../shared/models/image.schema.js"
import { authSchema } from "../shared/models/auth.schema.js"

const socialLinksSchema = new mongoose.Schema(
  {
    website: {
      type: String,
      default: "",
      trim: true,
    },
    x: {
      type: String,
      default: "",
      trim: true,
    },
    instagram: {
      type: String,
      default: "",
      trim: true,
    },
    facebook: {
      type: String,
      default: "",
      trim: true,
    },
    linkedin: {
      type: String,
      default: "",
      trim: true,
    },
    youtube: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    zipCode: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    verifiedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const statsSchema = new mongoose.Schema(
  {
    followers: {
      type: Number,
      default: 0,
      min: 0,
    },

    stories: {
      type: Number,
      default: 0,
      min: 0,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const authorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_.-]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },

    auth: {
      type: authSchema,
      default: () => ({}),
    },

    phone: {
      type: String,
      trim: true,
      required: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    profession: {
      type: String,
      trim: true,
      maxlength: 100,
      required: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: true,
    },

    avatar: {
      type: imageSchema,
      required: true,
    },

    coverImage: {
      type: imageSchema,
      default: () => ({}),
    },

    address: {
      type: addressSchema,
      required: true,
    },

    socialLinks: {
      type: socialLinksSchema,
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

    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
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

        if (ret.auth) {
          delete ret.auth.passwordHash;
          delete ret.auth.emailVerificationToken;
          delete ret.auth.emailVerificationExpires;
          delete ret.auth.passwordResetOTP;
          delete ret.auth.passwordResetOTPExpires;
          delete ret.auth.passwordResetVerified;
          delete ret.auth.lastLoginAt;
        }

        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

// Indexes — username & email already have `unique: true` on field definitions
// so no need for duplicate schema.index() calls
authorSchema.index({ fullName: "text" });
authorSchema.index({ status: 1 });

// Hash password before saving
authorSchema.pre("save", async function (next) {
  if (!this.isModified("auth.passwordHash")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.auth.passwordHash = await bcrypt.hash(
      this.auth.passwordHash,
      salt
    );
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
authorSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.auth.passwordHash);
};

const Author =
  mongoose.models.Author ||
  mongoose.model("Author", authorSchema);

export default Author;