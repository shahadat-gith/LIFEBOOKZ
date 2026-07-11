import mongoose from 'mongoose';
import { usersConn } from '../shared/config/database.js';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, select: false },
    avatar: { type: String, default: '' },
    googleId: { type: String, index: true, sparse: true },

    preferences: {
      interests: { type: [String], default: [] },
      profession: { type: String, default: '' },
      education: { type: [String], default: [] },
      skills: { type: [String], default: [] },
      goals: { type: [String], default: [] },
      languages: { type: [String], default: ['en'] },
      location: { country: { type: String, default: '' }, city: { type: String, default: '' } },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.googleId;
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
};

const User = usersConn.model('User', userSchema);
export default User;
