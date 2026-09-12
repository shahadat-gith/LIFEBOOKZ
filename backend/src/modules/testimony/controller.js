import * as testimonialService from "./service.js";

/**
 * GET /testimonials
 * Public — latest testimonials.
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
 * POST /testimonials
 * Authenticated users & authors can leave a testimonial.
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
