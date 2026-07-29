import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { imageSchema } from "../shared/models/image.schema.js";
import { authSchema } from "../shared/models/auth.schema.js";


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

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.auth.passwordHash);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
