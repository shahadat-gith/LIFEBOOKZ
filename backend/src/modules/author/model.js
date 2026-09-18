import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { imageSchema } from "../../core/models/image.schema.js"
import { authSchema } from "../../core/models/auth.schema.js"

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

    // Profile details are optional at signup — the lightweight registration
    // only needs name, email, password and username. Completing these unlocks
    // publishing (tracked by `isProfileCompleted`).
    phone: {
      type: String,
      trim: true,
      default: "",
    },

    dob: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", null],
      default: null,
    },

    profession: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    avatar: {
      type: imageSchema,
      default: () => ({}),
    },

    coverImage: {
      type: imageSchema,
      default: () => ({}),
    },

    /**
     * Mobile (4:3) variant of the cover. Phones are much narrower than
     * desktops, so authors pick a tighter crop for small screens — rendered
     * below the `sm` breakpoint instead of the wide desktop banner.
     */
    coverImageMobile: {
      type: imageSchema,
      default: () => ({}),
    },

    address: {
      type: addressSchema,
      default: () => ({}),
    },

    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },

    stats: {
      type: statsSchema,
      default: () => ({}),
    },

    /**
     * False right after the lightweight signup (name/email/password/username).
     * Becomes true once the author fills in the full profile (profession,
     * bio, phone, DOB, gender, address). Publishing is gated on this.
     */
    isProfileCompleted: {
      type: Boolean,
      default: false,
      index: true,
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

// Every account type advertises a constant role so clients and logs never
// have to infer it from the portal that was used to sign in.
authorSchema.virtual("role").get(() => "author");

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