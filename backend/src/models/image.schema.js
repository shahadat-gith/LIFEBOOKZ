import mongoose from "mongoose";

/**
 * Reference to a file stored in Cloudflare R2. `url` is the publicly
 * accessible URL; `key` is the R2 object key (used to delete the object
 * or mint presigned operations later).
 */
export const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },
    key: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);