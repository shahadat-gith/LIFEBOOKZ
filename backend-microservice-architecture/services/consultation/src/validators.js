import { v } from "@lifebookz/shared-validation";

import { BOOKING_STATUSES, CONSULT_CATEGORY_IDS, PREFERRED_CONTACTS, SESSION_TYPES } from "./constants.js";

const imageSchema = v.object({
  url: v.string({ max: 2000 }).default(""),
  key: v.string({ max: 500 }).default(""),
});

export const matchSchema = {
  problem: v.string({ min: 10, max: 4000 }),
  category: v.enumOf(CONSULT_CATEGORY_IDS).optional(),
  limit: v.number({ min: 1, max: 10, integer: true }).optional(),
};

export const createBookingSchema = {
  expertId: v.string({ min: 1, max: 64 }),
  problem: v.string({ min: 10, max: 4000 }),
  category: v.enumOf(CONSULT_CATEGORY_IDS).optional(),
  sessionType: v.enumOf(SESSION_TYPES).default("video"),
  date: v.string({ max: 40 }).default(""),
  time: v.string({ max: 40 }).default(""),
  notes: v.string({ max: 2000 }).default(""),
  preferredContact: v.enumOf(PREFERRED_CONTACTS).default("email"),
  // Optional client-supplied contact snapshot (the consult form also serves
  // readers who have not filled in their profile yet).
  clientName: v.string({ max: 120 }).optional(),
  clientPhone: v.string({ max: 30 }).optional(),
};

export const updateBookingStatusSchema = {
  status: v.enumOf(BOOKING_STATUSES),
};

export const expertProfileSchema = {
  phone: v.string({ min: 5, max: 30 }).optional(),
  expertise: v.string({ min: 2, max: 200 }).optional(),
  qualification: v.string({ min: 2, max: 300 }).optional(),
  bio: v.string({ max: 2000 }).optional(),
  languages: v.arrayOf(v.string({ min: 2, max: 40 })).optional(),
  experience: v.number({ min: 0, max: 60, integer: true }).optional(),
  price: v.number({ min: 0, max: 1000000 }).optional(),
  // Arrives as a JSON string when the portal saves through FormData.
  categories: v.any().optional(),
  fullName: v.string({ min: 2, max: 100 }).optional(),
  username: v.string({ min: 3, max: 30 }).optional(),
  avatar: imageSchema.optional(),
  coverImage: imageSchema.optional(),
  coverImageMobile: imageSchema.optional(),
};

export const expertPresignSchema = {
  kind: v.enumOf(["expertAvatar", "expertCover", "expertCoverMobile"]),
  contentType: v.string({ min: 3, max: 120 }),
  size: v.number({ min: 0, max: 600 * 1024 * 1024, integer: true }).default(0),
  filename: v.string({ max: 255 }).optional(),
};

export const mediaReferenceSchema = {
  key: v.string({ max: 500 }).optional(),
  url: v.string({ max: 2000 }).optional(),
};

export const paginationSchema = {
  page: v.number({ min: 1, integer: true }).default(1),
  limit: v.number({ min: 1, max: 50, integer: true }).default(20),
};
