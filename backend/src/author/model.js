import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const authorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    profession: {
      type: String,
      required: true,
      trim: true,
    },

    avatar: {
      url: {
        type: String,
        trim: true,
        default: "",
      },

      publicId: {
        type: String,
        trim: true,
        default: "",
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },


    website: {
      type: String,
      trim: true,
      default: "",
    },

    socialLinks: {
      x: {
        type: String,
        trim: true,
        default: "",
      },

      linkedin: {
        type: String,
        trim: true,
        default: "",
      },

      instagram: {
        type: String,
        trim: true,
        default: "",
      },
    },

    verification: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },

      rejectionReason: {
        type: String,
        default: "",
      },

      verifiedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
  },
);

authorSchema.index({
  fullName: "text",
  bio: "text",
});

authorSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

authorSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const Author = mongoose.models.Author || mongoose.model("Author", authorSchema);

export default Author;
