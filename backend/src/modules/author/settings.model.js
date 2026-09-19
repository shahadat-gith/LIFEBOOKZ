import mongoose from "mongoose";

/**
 * Author preferences.
 *
 * One document per author (created lazily on the first save), so every part
 * of the system — the writer, the directory, notifications, sign-in — has a
 * single place to ask "how does this author want things?". Authors without a
 * document are treated as `DEFAULT_AUTHOR_SETTINGS`.
 */

export const VISIBILITIES = ["public", "followers", "private"];

export const DEFAULT_AUTHOR_SETTINGS = Object.freeze({
  defaultVisibility: "public",
  autosave: true,
  showWordCount: true,
  inDirectory: true,
  twoStep: false,
  notifications: Object.freeze({
    likes: true,
    comments: true,
    followers: true,
  }),
});

/** A fresh, mutable copy of the defaults. */
export function defaultAuthorSettings() {
  return {
    ...DEFAULT_AUTHOR_SETTINGS,
    notifications: { ...DEFAULT_AUTHOR_SETTINGS.notifications },
  };
}

const notificationPrefsSchema = new mongoose.Schema(
  {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    followers: { type: Boolean, default: true },
  },
  { _id: false },
);

const authorSettingsSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
      unique: true,
      index: true,
    },

    // Default visibility applied to new stories and chapters.
    defaultVisibility: {
      type: String,
      enum: VISIBILITIES,
      default: DEFAULT_AUTHOR_SETTINGS.defaultVisibility,
    },

    // Drafts are saved automatically while writing.
    autosave: { type: Boolean, default: DEFAULT_AUTHOR_SETTINGS.autosave },

    // Live word counter in the story editor.
    showWordCount: {
      type: Boolean,
      default: DEFAULT_AUTHOR_SETTINGS.showWordCount,
    },

    // Include the profile in the public author directory.
    inDirectory: { type: Boolean, default: DEFAULT_AUTHOR_SETTINGS.inDirectory },

    // Ask for a one-time code on every sign-in.
    twoStep: { type: Boolean, default: DEFAULT_AUTHOR_SETTINGS.twoStep },

    // Which in-app notifications the author wants to receive.
    notifications: {
      type: notificationPrefsSchema,
      default: () => ({}),
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
        return ret;
      },
    },
  },
);

const AuthorSettings =
  mongoose.models.AuthorSettings ||
  mongoose.model("AuthorSettings", authorSettingsSchema);

export default AuthorSettings;
