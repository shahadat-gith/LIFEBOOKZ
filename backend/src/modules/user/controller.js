import * as userService from "./service.js";

/* ---------- Authentication ---------- */

export async function register(req, res, next) {
  try {
    const { user, token } = await userService.registerUser({
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      file: req.file,
    });

    return res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { user, token } = await userService.loginUser({
      email: req.body.email,
      password: req.body.password,
      ip: req.ip,
    });

    return res.json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Profile ---------- */

export async function getMe(req, res, next) {
  try {
    const user = await userService.getUserById(req.user?.id);

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const user = await userService.updateUser({
      userId: req.user?.id,
      fullName: req.body.fullName,
      file: req.files?.avatar?.[0] || null,
      coverFile: req.files?.coverImage?.[0] || null,
      coverMobileFile: req.files?.coverImageMobile?.[0] || null,
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteMe(req, res, next) {
  try {
    await userService.deleteUser({ userId: req.user?.id });

    return res.json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await userService.getPublicProfile(req.params.userId);

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

/* ---------- Password Reset (OTP-based) ---------- */

export async function forgotPassword(req, res, next) {
  try {
    await userService.requestPasswordReset({ email: req.body.email });

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
    const resetToken = await userService.verifyPasswordResetOTP({
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
    await userService.resetPassword({
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
