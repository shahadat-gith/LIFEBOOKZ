import { forbiddenError, notFoundError, validationError } from "@lifebookz/shared-errors";

import { modelForRole } from "../repositories/engagement.js";

/**
 * Testimonials live with the content domain (Story) and are moderated by an
 * admin. The moderation *decision* is authorized by the role in the JWT — the
 * admin's identity itself is owned by Auth/System.
 */
export function createTestimonialService({ testimonials, publisher, logger }) {
  return {
    async list({ limit } = {}) {
      return testimonials.list({ limit });
    },

    async mine({ accountId, role }) {
      if (!accountId) return null;

      return testimonials.findMine({ person: accountId, personType: modelForRole(role) });
    },

    /** One testimonial per person — posting again updates the existing one. */
    async create({ claims, message, rating }) {
      const text = String(message || "").trim();

      if (!text) {
        throw validationError("Testimonial message is required.", {
          fields: { message: "Testimonial message is required." },
        });
      }

      const personType = modelForRole(claims.role);
      const safeRating = rating ? Math.min(Math.max(Number(rating), 1), 5) : 5;

      const saved = await testimonials.upsert({
        person: claims.accountId,
        personType,
        message: text.slice(0, 1000),
        rating: safeRating,
      });

      await publisher?.publishSafely({
        type: "TestimonialCreated",
        data: { testimonialId: String(saved._id), personType, rating: safeRating },
        actor: claims,
      });

      return saved;
    },

    async remove({ id, claims }) {
      const testimonial = await testimonials.findById(id);

      if (!testimonial) throw notFoundError("Testimonial not found.");

      const isOwner = String(testimonial.person) === String(claims.accountId);
      const isAdmin = claims.role === "admin";

      if (!isOwner && !isAdmin) {
        throw forbiddenError("You cannot delete this testimonial.");
      }

      await testimonials.delete(id);

      await publisher?.publishSafely({
        type: "TestimonialDeleted",
        data: { testimonialId: String(id), personType: testimonial.personType },
        actor: claims,
      });

      return { deleted: true };
    },

    async moderate({ id, status, claims }) {
      if (!["approved", "hidden"].includes(status)) {
        throw validationError("Invalid status.", { fields: { status: "Status must be approved or hidden." } });
      }

      if (claims.role !== "admin") {
        throw forbiddenError("Only an admin can moderate testimonials.");
      }

      const updated = await testimonials.setStatus({ id, status });

      if (!updated) throw notFoundError("Testimonial not found.");

      await publisher?.publishSafely({
        type: "TestimonialModerated",
        data: { testimonialId: String(id), status },
        actor: claims,
      });

      return updated;
    },
  };
}
