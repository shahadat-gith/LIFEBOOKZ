import mongoose from "mongoose";


const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    bannerImage: { 
      url: { type: String, required: true },
      publicId: { type: String, required: true },
     },

    content: { type: String, required: true, maxlength: 100000 },

    summary: { type: String, maxlength: 1000, default: '' },

    tags: { type: [String], default: [], index: true },
    language: {
      type: String,
      default: "en",
      enum: ["en", "es", "fr", "de", "ja", "zh", "pt", "ar", "hi"],
    },
    embeddingId: { type: String, default: null },
    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
  },
);

storySchema.index({ language: 1 });
storySchema.index({ publishedAt: -1 });
storySchema.index({ author: 1, publishedAt: -1 });
storySchema.index({ title: 'text', content: 'text' });

const Story = mongoose.model("stories", storySchema);
export default Story;
