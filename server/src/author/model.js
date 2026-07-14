import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const authorSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false, required: true },
    fullName: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 2000, default: '' },
    website: { type: String, default: '' },

    kyc: {
      dateOfBirth: { type: Date },
      phoneNumber: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        zipCode: { type: String },
      },
      governmentId: {
        type: { type: String, enum: ['passport', 'driving-license', 'aadhar-card', 'pan-card'] },
        number: { type: String },
        documentUrl: { type: String },
      },
    },

    socialLinks: {
      x: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },

    verification:{
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      rejectionReason: { type: String, default: '' },
      verifiedAt: { type: Date, default: Date.now },
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
  }
);

authorSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

authorSchema.methods.comparePassword = async function (candidate) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
};

const Author = mongoose.models.Author || mongoose.model("authors", authorSchema)
export default Author;
