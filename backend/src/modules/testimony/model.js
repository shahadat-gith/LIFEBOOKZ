import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    personType: {
      type: String,
      enum: ["User", "Author", "Expert"],
      required: true,
    },

    person: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "personType",
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },

    // Public testimonials only appear in the section once approved.
    // Auto-approved at creation for now — an admin can hide it later.
    status: {
      type: String,
      enum: ["approved", "hidden"],
      default: "approved",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  },
);

testimonialSchema.pre("validate", async function (next) {
  try {
    if (!this.isModified("person") && !this.isModified("personType")) {
      return next();
    }

    const Model = mongoose.model(this.personType);

    const exists = await Model.exists({ _id: this.person });

    if (!exists) {
      return next(new Error(`${this.personType} does not exist.`));
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Testimonial =
  mongoose.models.Testimonial || mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
