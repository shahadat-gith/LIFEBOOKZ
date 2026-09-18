import * as expertService from "./service.js";

/* ---------- Authentication ---------- */

export async function register(req, res, next) {
  try {
    const { expert, token } = await expertService.registerExpert({
      body: req.body,
      file: req.file,
    });

    return res.status(201).json({
      success: true,
      data: { expert, token },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { expert, token } = await expertService.loginExpert({
      email: req.body.email,
      password: req.body.password,
      ip: req.ip,
    });

    return res.json({
      success: true,
      data: { expert, token },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req, res, next) {
  try {
    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Self service (expert role — pending experts included) ---------- */

export async function getMe(req, res, next) {
  try {
    const expert = await expertService.getMyExpertProfile(req.user?.id);

    return res.json({ success: true, data: expert });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const expert = await expertService.updateExpert({
      userId: req.user?.id,
      body: req.body,
      file: req.files?.avatar?.[0] || null,
      coverFile: req.files?.coverImage?.[0] || null,
      coverMobileFile: req.files?.coverImageMobile?.[0] || null,
    });

    return res.json({ success: true, data: expert });
  } catch (error) {
    next(error);
  }
}

/* ---------- Bookings ---------- */

export async function getMyBookings(req, res, next) {
  try {
    const bookings = await expertService.listBookingsForExpert({
      expertId: req.user?.id,
    });

    return res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const booking = await expertService.setBookingStatus({
      expertId: req.user?.id,
      bookingId: req.params.bookingId,
      status: req.body.status,
    });

    return res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

/* ---------- Public ---------- */

export async function getProfile(req, res, next) {
  try {
    const expert = await expertService.getPublicExpert(req.params.expertId);

    return res.json({ success: true, data: expert });
  } catch (error) {
    next(error);
  }
}

/* ---------- Password reset (OTP based) ---------- */

export async function forgotPassword(req, res, next) {
  try {
    await expertService.requestPasswordReset({ email: req.body.email });

    return res.json({
      success: true,
      message:
        "If an account with that email exists, an OTP has been sent. Please check your inbox and spam folder.",
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyResetOTP(req, res, next) {
  try {
    const resetToken = await expertService.verifyPasswordResetOTP({
      email: req.body.email,
      otp: req.body.otp,
    });

    return res.json({
      success: true,
      data: { resetToken },
      message: "OTP verified. You can now reset your password.",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    await expertService.resetPassword({
      resetToken: req.body.resetToken,
      password: req.body.password,
    });

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}
