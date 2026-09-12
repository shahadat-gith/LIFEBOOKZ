import Testimonial from "./model.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../core/utils/errors.js";

const PERSON_SELECT = "fullName avatar profession";

/**
 * Latest testimonials, newest first.
 */
export async function listTestimonials({ limit } = {}) {
  const safeLimit = Math.min(Number(limit) || 20, 50);

  return Testimonial.find()
    .populate("person", PERSON_SELECT)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();
}

/**
 * Users and authors can leave one testimonial at a time.
 */
export async function createTestimonial({ role, userId, message, rating }) {
  if (!message?.trim()) {
    throw new ValidationError("Testimonial message is required.");
  }

  if (role !== "user" && role !== "author") {
    throw new ForbiddenError(
      "Only authenticated users and authors can post testimonials.",
    );
  }

  const testimonial = await Testimonial.create({
    personType: role === "author" ? "Author" : "User",
    person: userId,
    message: message.trim(),
    rating: rating ? Math.min(Math.max(Number(rating), 1), 5) : 5,
  });

  return Testimonial.findById(testimonial.id)
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
