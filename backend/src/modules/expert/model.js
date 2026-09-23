import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { imageSchema } from "../../core/models/image.schema.js";
import { authSchema } from "../../core/models/auth.schema.js";
import { CONSULT_CATEGORY_IDS } from "./constants.js";

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
  { _id: false },
);

const expertSchema = new mongoose.Schema(
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

    // High level ground/domain the expert is an authority in,
    // e.g. "Child psychology & academic counselling".
    expertise: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },

    qualification: {
      type: String,
      trim: true,
      required: true,
      maxlength: 300,
    },

    // Categories the expert is willing to take consultations in.
    categories: {
      type: [
        {
          type: String,
          enum: CONSULT_CATEGORY_IDS,
        },
      ],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Select at least one consultancy category.",
      },
      required: true,
    },

    bio: {
      type: String,
      trim: true,
      required: true,
      maxlength: 2000,
    },

    languages: {
      type: [String],
      default: ["English"],
    },

    experience: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },

    price: {
      type: Number,
      min: 0,
      default: 0,
    },

    avatar: {
      type: imageSchema,
      default: () => ({}),
    },

    /** Wide (16:5) cover shown on larger screens. */
    coverImage: {
      type: imageSchema,
      default: () => ({}),
    },

    /** Taller (4:3) cover shown on phones. */
    coverImageMobile: {
      type: imageSchema,
      default: () => ({}),
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    // Number of consultations completed through the platform.
    sessions: {
      type: Number,
      min: 0,
      default: 0,
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
  },
);

// Every account type advertises a constant role so clients and logs never
// have to infer it from the portal that was used to sign in.
expertSchema.virtual("role").get(() => "expert");

expertSchema.index({ status: 1 });
expertSchema.index({ categories: 1, rating: -1 });

expertSchema.pre("save", async function (next) {
  if (!this.isModified("auth.passwordHash")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.auth.passwordHash = await bcrypt.hash(
      this.auth.passwordHash,
      salt,
    );
    next();
  } catch (err) {
    next(err);
  }
});

const Expert =
  mongoose.models.Expert || mongoose.model("Expert", expertSchema);

export default Expert;
