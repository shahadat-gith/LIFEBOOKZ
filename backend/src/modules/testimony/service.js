import Testimonial from "./model.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../core/utils/errors.js";

const PERSON_SELECT = "fullName avatar profession";

/**
 * Latest approved testimonials, newest first.
 */
export async function listTestimonials({ limit } = {}) {
  const safeLimit = Math.min(Number(limit) || 20, 50);

  return Testimonial.find({ status: "approved" })
    .populate("person", PERSON_SELECT)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();
}

/**
 * Users, authors and experts can each leave one testimonial at a time.
 */
export async function createTestimonial({ role, userId, message, rating }) {
  if (!message?.trim()) {
    throw new ValidationError("Testimonial message is required.");
  }

  if (role !== "user" && role !== "author" && role !== "expert") {
    throw new ForbiddenError(
      "Only authenticated users, authors and experts can post testimonials.",
    );
  }

  const personType = role === "author" ? "Author" : role === "expert" ? "Expert" : "User";

  const existing = await Testimonial.findOne({ personType, person: userId });
  if (existing) {
    throw new ValidationError(
      "You have already shared a testimonial. Delete your old one to write a new one.",
    );
  }

  const testimonial = await Testimonial.create({
    personType,
    person: userId,
    message: message.trim().slice(0, 1000),
    rating: rating ? Math.min(Math.max(Number(rating), 1), 5) : 5,
  });

  return Testimonial.findById(testimonial.id)
    .populate("person", PERSON_SELECT)
    .lean();
}

/**
 * The signed-in person's own testimonial (or null).
 */
export async function getMyTestimonial({ role, userId }) {
  if (!userId || !["user", "author", "expert"].includes(role)) return null;
  const personType =
    role === "author" ? "Author" : role === "expert" ? "Expert" : "User";
  return Testimonial.findOne({ personType, person: userId })
    .populate("person", PERSON_SELECT)
    .lean();
}

/**
 * Admins and the testimonial owner can remove a testimonial.
 */
export async function deleteTestimonial({ id, userId, isAdmin }) {
  const testimonial = await Testimonial.findById(id);

  if (!testimonial) {
    throw new NotFoundError("Testimonial not found.");
  }

  const isOwner = userId && testimonial.person.toString() === userId.toString();

  if (!isAdmin && !isOwner) {
    throw new ForbiddenError("You cannot delete this testimonial.");
  }

  await testimonial.deleteOne();
}

/**
 * Admin moderation — hide or re-approve a testimonial.
 */
export async function moderateTestimonial({ id, status }) {
  if (!["approved", "hidden"].includes(status)) {
    throw new ValidationError("Invalid status.");
  }

  const testimonial = await Testimonial.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  ).populate("person", PERSON_SELECT);

  if (!testimonial) {
    throw new NotFoundError("Testimonial not found.");
  }

  return testimonial;
}
