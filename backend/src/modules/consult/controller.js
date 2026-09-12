import * as consultService from "./service.js";

/* ---------- Semantic matching ---------- */

/**
 * POST /consult/match
 */
export async function matchExperts(req, res, next) {
  try {
    const { experts, category, matched } = await consultService.matchExperts({
      problem: req.body.problem,
      category: req.body.category,
      limit: req.body.limit,
    });

    return res.json({
      success: true,
      data: {
        experts,
        total: experts.length,
        category,
        matched,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Bookings ---------- */

/**
 * POST /consult/bookings
 * Only signed-in users can book (route is guarded by authenticate +
 * authorize("user")).
 */
export async function createBooking(req, res, next) {
  try {
    const booking = await consultService.createBooking({
      user: req.user,
      input: req.body,
    });

    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /consult/bookings
 */
export async function getMyBookings(req, res, next) {
  try {
    const bookings = await consultService.listMyBookings({
      userId: req.user?.id,
    });

    return res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /consult/bookings/:bookingId/cancel
 */
export async function cancelMyBooking(req, res, next) {
  try {
    const booking = await consultService.cancelMyBooking({
      userId: req.user?.id,
      bookingId: req.params.bookingId,
    });

    return res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}
