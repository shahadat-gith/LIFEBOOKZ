import { v } from "@lifebookz/shared-validation";

const imageSchema = v.object({
  url: v.string({ max: 2000 }).default(""),
  key: v.string({ max: 500 }).default(""),
});

const mediaSchema = v.arrayOf({
  url: v.string({ min: 1, max: 2000 }),
  key: v.string({ max: 500 }).default(""),
  type: v.enumOf(["image", "video"]).default("image"),
  caption: v.string({ max: 300 }).default(""),
});

const visibility = v.enumOf(["public", "followers", "private"]);
const storyType = v.enumOf(["experience", "achievement", "challenge", "memory", "lesson", "other"]);

export const createLifebookSchema = {
  title: v.string({ min: 2, max: 150 }),
  language: v.string({ max: 40 }).default("English"),
  visibility: visibility.default("public"),
  bannerImage: imageSchema.optional(),
};

export const updateLifebookSchema = {
  title: v.string({ min: 2, max: 150 }).optional(),
  language: v.string({ max: 40 }).optional(),
  visibility: visibility.optional(),
  bannerImage: imageSchema.optional(),
  featured: v.boolean().optional(),
};

export const feedQuerySchema = {
  profession: v.string({ max: 100 }).optional(),
  language: v.string({ max: 40 }).optional(),
  sort: v.enumOf(["recent", "popular", "featured"]).default("recent"),
  page: v.number({ min: 1, integer: true }).default(1),
  limit: v.number({ min: 1, max: 50, integer: true }).optional(),
};

export const searchQuerySchema = {
  q: v.string({ max: 120 }).optional(),
  profession: v.string({ max: 100 }).optional(),
  limit: v.number({ min: 1, max: 50, integer: true }).default(20),
};

export const chapterSchema = { title: v.string({ max: 200 }).optional() };

export const updateChapterSchema = {
  title: v.string({ min: 1, max: 200 }).optional(),
  order: v.number({ min: 0, max: 100, integer: true }).optional(),
};

export const entrySchema = {
  title: v.string({ min: 1, max: 200 }),
  storyType: storyType.default("experience"),
  content: v.string({ max: 50000 }).default(""),
  dateLabel: v.string({ max: 100 }).default(""),
  location: v.string({ max: 150 }).default(""),
  media: mediaSchema.default(() => []),
  visibility: visibility.default("public"),
};

export const updateEntrySchema = {
  title: v.string({ min: 1, max: 200 }).optional(),
  storyType: storyType.optional(),
  content: v.string({ max: 50000 }).optional(),
  dateLabel: v.string({ max: 100 }).optional(),
  location: v.string({ max: 150 }).optional(),
  media: mediaSchema.optional(),
  visibility: visibility.optional(),
};

export const commentSchema = { content: v.string({ min: 1, max: 5000, trim: false }) };

export const paginationSchema = {
  page: v.number({ min: 1, integer: true }).default(1),
  limit: v.number({ min: 1, max: 50, integer: true }).default(20),
};

export const authorProfileSchema = {
  profession: v.string({ min: 1, max: 100 }).optional(),
  bio: v.string({ max: 2000 }).optional(),
  phone: v.string({ max: 30 }).optional(),
  dob: v.string({ max: 40 }).optional(),
  gender: v.enumOf(["Male", "Female", "Other"]).optional(),
  address: v.any().optional(),
  socialLinks: v.any().optional(),
  avatar: imageSchema.optional(),
  coverImage: imageSchema.optional(),
  coverImageMobile: imageSchema.optional(),
};

/** Author-facing media kinds (reader media is presigned by Auth). */
export const authorPresignSchema = {
  kind: v.enumOf(["authorAvatar", "authorCover", "authorCoverMobile"]),
  contentType: v.string({ min: 3, max: 120 }),
  size: v.number({ min: 0, max: 600 * 1024 * 1024, integer: true }).default(0),
  filename: v.string({ max: 255 }).optional(),
};

export const storyPresignSchema = {
  kind: v.enumOf(["storyImage", "storyVideo", "storyCover"]),
  contentType: v.string({ min: 3, max: 120 }),
  size: v.number({ min: 0, max: 600 * 1024 * 1024, integer: true }).default(0),
  filename: v.string({ max: 255 }).optional(),
};

export const mediaReferenceSchema = {
  key: v.string({ max: 500 }).optional(),
  url: v.string({ max: 2000 }).optional(),
};

export const testimonialSchema = {
  message: v.string({ min: 1, max: 1000, trim: false }),
  rating: v.number({ min: 1, max: 5, integer: true }).optional(),
};

export const moderationSchema = { status: v.enumOf(["approved", "hidden"]) };
