import { notFoundError, validationError } from "@lifebookz/shared-errors";

import { BOOKING_STATUSES, CONSULT_CATEGORY_IDS, MIN_PROBLEM_LENGTH, SESSION_TYPES } from "../constants.js";

/** Statuses a client may still cancel. */
const CANCELLABLE = ["pending", "confirmed"];

/**
 * Consultation bookings.
 *
 * Compared with the monolith:
 *  - the booking, its status change and its cancellation are recorded locally
 *    and announced as domain events instead of sending email inline, so an SES
 *    outage can never fail a booking;
 *  - the reader/expert identity snapshot (`clientName`, `clientEmail`) is taken
 *    from the verified JWT claims plus the request body, because the JWT can no
 *    longer be trusted to be fresh and this service must not read Auth's
 *    cluster;
 *  - "a completed consultation counts once" is enforced with a conditional
 *    update rather than a read-then-write, so two concurrent expert clicks
 *    cannot double-count a session.
 */
export function createBookingService({ bookings, expertProfiles, publisher, logger }) {
  async function findAvailableExpert(expertId) {
    const expert = await expertProfiles.findById(expertId);

    if (!expert || expert.accountStatus !== "active" || expert.verification?.status !== "approved") {
      throw notFoundError("Expert not found or not available.");
    }

    return expert;
  }

  /** Transport-only PII block; the analytics worker drops it before S3. */
  function notifyBlock({ booking, expert, clientName, clientEmail }) {
    return {
      expertEmail: expert.email,
      expertName: expert.fullName,
      clientEmail: clientEmail || booking.clientEmail || "",
      clientName: clientName || booking.clientName || "",
      sessionType: booking.sessionType,
      date: booking.date,
      time: booking.time,
      category: booking.category || null,
      problem: booking.problem,
      status: booking.status,
    };
  }

  function view(booking, expert) {
    return {
      ...booking,
      id: String(booking._id || booking.id),
      expert: expert
        ? {
            id: String(expert._id || expert.id),
            fullName: expert.fullName,
            username: expert.username,
            expertise: expert.expertise,
            price: expert.price,
            avatar: expert.avatar,
            categories: expert.categories,
            rating: expert.rating,
          }
        : null,
    };
  }

  return {
    async book({ accountId, claims, input }) {
      const cleanProblem = input.problem?.trim();
      const cleanCategory = input.category?.trim() || "";

      if (!input.expertId) throw validationError("Please choose an expert to book.");
      if (!cleanProblem || cleanProblem.length < MIN_PROBLEM_LENGTH) {
        throw validationError(`Please describe your problem in at least ${MIN_PROBLEM_LENGTH} characters.`);
      }
      if (cleanCategory && !CONSULT_CATEGORY_IDS.includes(cleanCategory)) {
        throw validationError("Unknown consultancy category.");
      }
      if (input.sessionType && !SESSION_TYPES.includes(input.sessionType)) {
        throw validationError("Unknown session type.");
      }

      const expert = await findAvailableExpert(input.expertId);

      const created = await bookings.create({
        client: accountId,
        // The reader's own profile may hold a display name the JWT does not
        // carry, so an explicit name always wins; otherwise the token's display
        // name, otherwise the username. Never a lookup into Auth.
        clientName: (input.clientName || claims?.name || claims?.username || "").toString().trim().slice(0, 120),
        clientEmail: (claims?.email || "").toString().trim().toLowerCase(),
        clientPhone: (input.clientPhone || "").toString().trim().slice(0, 30),
        expert: expert._id,
        problem: cleanProblem,
        category: cleanCategory || undefined,
        sessionType: input.sessionType || "video",
        date: input.date?.trim() || "",
        time: input.time?.trim() || "",
        notes: input.notes?.trim() || "",
        preferredContact: input.preferredContact || "email",
      });

      await publisher?.publishSafely({
        type: "ConsultationBooked",
        data: {
          bookingId: String(created._id || created.id),
          expertId: String(expert._id),
          clientId: String(accountId),
          category: created.category || null,
          sessionType: created.sessionType,
          date: created.date,
          time: created.time,
          status: created.status,
        },
        notify: notifyBlock({ booking: created, expert, clientName: created.clientName, clientEmail: created.clientEmail }),
        actor: { accountId: String(accountId), role: "user" },
      });

      logger?.info?.("Consultation booked", {
        bookingId: String(created._id || created.id),
        expertId: String(expert._id),
        accountId: String(accountId),
      });

      return view(created, expert);
    },

    /** The signed-in reader's own bookings, newest first. */
    async listMine({ accountId }) {
      return bookings.listForClient({ clientId: accountId });
    },

    /** Cancellation by the booking's owner. */
    async cancel({ accountId, bookingId }) {
      const booking = await bookings.findForClient({ bookingId, clientId: accountId });

      if (!booking) throw notFoundError("Booking not found.");

      if (!CANCELLABLE.includes(booking.status)) {
        throw validationError(`A ${booking.status} booking cannot be cancelled.`);
      }

      const previousStatus = booking.status;
      booking.status = "cancelled";
      booking.statusChangedAt = new Date();

      const saved = await bookings.save(booking);

      await publisher?.publishSafely({
        type: "ConsultationCancelled",
        data: {
          bookingId: String(booking._id),
          expertId: String(booking.expert),
          clientId: String(accountId),
          previousStatus,
        },
        actor: { accountId: String(accountId), role: "user" },
      });

      return saved;
    },

    /** The expert dashboard: every request addressed to this expert. */
    async listForExpert({ accountId }) {
      return bookings.listForExpert({ expertId: accountId });
    },

    /** An expert rules on one of their own bookings. */
    async setStatus({ accountId, bookingId, status }) {
      if (!BOOKING_STATUSES.includes(status)) {
        throw validationError(`Status must be one of: ${BOOKING_STATUSES.join(", ")}.`);
      }

      const booking = await bookings.findForExpert({ bookingId, expertId: accountId });

      if (!booking) throw notFoundError("Booking not found.");

      const previousStatus = booking.status;

      // Atomic transition: `status: { $ne: to }` means only the first of two
      // concurrent "completed" clicks modifies the document.
      const transitioned = await bookings.transitionStatus({
        bookingId: booking._id,
        expertId: accountId,
        to: status,
        completedAt: status === "completed" ? new Date() : null,
      });

      if (!transitioned) {
        const current = await bookings.findById(bookingId);
        return current;
      }

      if (status === "completed") {
        await expertProfiles.incrementSessions({ accountId, by: 1 });
      }

      const fresh = await bookings.findById(bookingId);
      const expert = await expertProfiles.findById(accountId);

      if (previousStatus !== status) {
        // Email is never sent inline. The Notification service turns this event
        // into a queued, retryable email job addressed to the client.
        await publisher?.publishSafely({
          type: "ConsultationStatusChanged",
          data: {
            bookingId: String(bookingId),
            expertId: String(accountId),
            clientId: String(booking.client),
            previousStatus,
            status,
            sessionType: fresh.sessionType,
            date: fresh.date,
            time: fresh.time,
          },
          notify: notifyBlock({ booking: fresh, expert: expert || {}, clientName: fresh.clientName, clientEmail: fresh.clientEmail }),
          actor: { accountId: String(accountId), role: "expert" },
        });
      }

      logger?.info?.("Consultation status changed", {
        bookingId: String(bookingId),
        from: previousStatus,
        to: status,
        expertId: String(accountId),
      });

      return view(fresh, expert);
    },
  };
}
