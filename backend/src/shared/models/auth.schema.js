import mongoose from "mongoose";

export const authSchema = new mongoose.Schema(
  {
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: "",
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      default: "",
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    lastLoginAt: {
      type: Date,
      select: false,
    },
  },
  { _id: false }
);