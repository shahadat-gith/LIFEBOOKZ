import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { imageSchema } from "../../core/models/image.schema.js";
import { authSchema } from "../../core/models/auth.schema.js";


const statsSchema = new mongoose.Schema(
  {
    following: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
      required: true,
    },

    auth: {
      type: authSchema,
      default: () => ({}),
    },

    avatar: {
      type: imageSchema,
      default: () => ({}),
    },

    /** Wide (16:9) cover shown on larger screens. */
    coverImage: {
      type: imageSchema,
      default: () => ({}),
    },

    /** Taller (4:3) cover shown on phones. */
    coverImageMobile: {
      type: imageSchema,
      default: () => ({}),
    },

    stats: {
      type: statsSchema,
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
userSchema.virtual("role").get(() => "user");

userSchema.index({ status: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("auth.passwordHash")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.auth.passwordHash = await bcrypt.hash(this.auth.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
