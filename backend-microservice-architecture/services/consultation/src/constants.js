/**
 * Canonical consultancy vocabulary — the same ids the existing backend uses
 * (`modules/expert/constants.js`, `modules/consult/model.js`), so experts,
 * matching and bookings can never drift apart.
 */
export const CONSULT_CATEGORIES = [
  { id: "education", label: "Education" },
  { id: "relationship", label: "Relationship" },
  { id: "career", label: "Career & Job" },
  { id: "business", label: "Business" },
  { id: "growth", label: "Personal Growth" },
  { id: "health", label: "Health & Wellness" },
];

export const CONSULT_CATEGORY_IDS = CONSULT_CATEGORIES.map((category) => category.id);

export const categoryLabel = (id) => CONSULT_CATEGORIES.find((category) => category.id === id)?.label || id;

export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export const SESSION_TYPES = ["video", "audio", "chat"];

export const PREFERRED_CONTACTS = ["email", "phone", "video", "chat"];

/** A cross-portal "registered as an expert but booking as a reader" style check. */
export const MIN_PROBLEM_LENGTH = 10;
