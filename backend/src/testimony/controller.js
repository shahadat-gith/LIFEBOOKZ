import Testimonial from "./model.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../shared/utils/errors.js";

const PERSON_SELECT = "fullName avatar profession";

/**
 * GET /testimonials
 * Public — latest testimonials.
 */
export async function list(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const testimonials = await Testimonial.find()
      .populate("person", PERSON_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /testimonials
 * Authenticated users & authors can leave a testimonial.
 */
export async function create(req, res, next) {
  try {
    const { message, rating } = req.body;

    if (!message?.trim()) {
      throw new ValidationError("Testimonial message is required.");
    }

    if (req.role !== "user" && req.role !== "author") {
      throw new ForbiddenError(
        "Only authenticated users and authors can post testimonials.",
      );
    }

    const testimonial = await Testimonial.create({
      personType: req.role === "author" ? "Author" : "User",
      person: req.user.id,
      message: message.trim(),
      rating: rating ? Math.min(Math.max(Number(rating), 1), 5) : 5,
    });

    const populated = await Testimonial.findById(testimonial.id)
      .populate("person", PERSON_SELECT)
      .lean();

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /testimonials/:id
 * Admin or the testimonial owner can remove it.
 */
export async function remove(req, res, next) {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      throw new NotFoundError("Testimonial not found.");
    }

    const isOwner =
      req.user && testimonial.person.toString() === req.user.id.toString();

    if (!req.admin && !isOwner) {
      throw new ForbiddenError("You cannot delete this testimonial.");
    }

    await testimonial.deleteOne();

    res.json({
      success: true,
      message: "Testimonial deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}
