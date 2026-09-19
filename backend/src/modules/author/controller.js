import * as authorService from "./service.js";

/* ---------- Authentication ---------- */

export async function register(req, res, next) {
  try {
    const { author, token } = await authorService.registerAuthor({
      body: req.body,
      file: req.file,
    });

    res.status(201).json({
      success: true,
      data: { author, token },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authorService.loginAuthor({
      email: req.body.email,
      password: req.body.password,
      ip: req.ip,
    });

    // Two-step sign-in returns a challenge instead of a session token; the
    // client then posts the emailed code to /login/verify.
    if (result.twoStepRequired) {
      return res.json({ success: true, data: result });
    }

    const { author, token } = result;

    return res.json({
      success: true,
      data: { author, token },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /authors/login/verify
 * Second step of a two-step sign-in.
 */
export async function verifyLoginOtp(req, res, next) {
  try {
    const { author, token } = await authorService.verifyLoginOtp({
      challengeId: req.body.challengeId || req.body.authorId,
      otp: req.body.otp || req.body.code,
    });

    return res.json({
      success: true,
      data: { author, token },
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Self service (author role — pending authors included) ---------- */

export async function getMe(req, res, next) {
  try {
    const author = await authorService.getMyAuthorProfile(req.user?.id);

    return res.json({ success: true, data: author });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const author = await authorService.updateAuthor({
      userId: req.user?.id,
      body: req.body,
      file: req.files?.avatar?.[0] || null,
      coverFile: req.files?.coverImage?.[0] || null,
      coverMobileFile: req.files?.coverImageMobile?.[0] || null,
    });

    return res.json({ success: true, data: author });
  } catch (error) {
    next(error);
  }
}

export async function getMyStories(req, res, next) {
  try {
    const stories = await authorService.listMyStories({
      authorId: req.user?.id,
    });

    return res.json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /authors/me/stats
 */
export async function getMyStats(req, res, next) {
  try {
    const data = await authorService.getMyAuthorStats({
      authorId: req.user?.id,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getMyStory(req, res, next) {
  try {
    const story = await authorService.getMyStory({
      authorId: req.user?.id,
      storyId: req.params.storyId,
    });

    return res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

/* ---------- Public ---------- */

export async function getProfile(req, res, next) {
  try {
    const author = await authorService.getPublicAuthor(req.params.authorId);

    return res.json({ success: true, data: author });
  } catch (error) {
    next(error);
  }
}

export async function listApproved(_req, res, next) {
  try {
    const authors = await authorService.listApprovedAuthors();

    return res.json({ success: true, data: authors });
  } catch (error) {
    next(error);
  }
}

/* ---------- Password Reset (OTP-based) ---------- */

export async function forgotPassword(req, res, next) {
  try {
    await authorService.requestPasswordReset({ email: req.body.email });

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
    const resetToken = await authorService.verifyPasswordResetOTP({
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
    await authorService.resetPassword({
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
