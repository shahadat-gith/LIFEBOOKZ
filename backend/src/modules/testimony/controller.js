import * as testimonialService from "./service.js";

/**
 * GET /testimonials
 * Public — latest approved testimonials.
 */
export async function list(req, res, next) {
  try {
    const testimonials = await testimonialService.listTestimonials({
      limit: req.query.limit,
    });

    res.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /testimonials/me
 * The signed-in person's own testimonial (any of the three roles).
 */
export async function mine(req, res, next) {
  try {
    const testimonial = await testimonialService.getMyTestimonial({
      role: req.role,
      userId: req.user?.id,
    });

    res.json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /testimonials
 * Authenticated users, authors and experts can leave a testimonial.
 */
export async function create(req, res, next) {
  try {
    const testimonial = await testimonialService.createTestimonial({
      role: req.role,
      userId: req.user.id,
      message: req.body.message,
      rating: req.body.rating,
    });

    res.status(201).json({
      success: true,
      data: testimonial,
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
    await testimonialService.deleteTestimonial({
      id: req.params.id,
      userId: req.user?.id,
      isAdmin: Boolean(req.admin),
    });

    res.json({
      success: true,
      message: "Testimonial deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /testimonials/:id/status
 * Admin moderation — approve or hide.
 */
export async function moderate(req, res, next) {
  try {
    const testimonial = await testimonialService.moderateTestimonial({
      id: req.params.id,
      status: req.body?.status,
    });

    res.json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    next(error);
  }
}
