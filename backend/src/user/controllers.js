import crypto from "crypto";
import User from "./model.js";

import { generateToken, setTokenCookie, clearTokenCookie } from "../shared/utils/helpers.js";
import config from "../shared/config/index.js";
import * as Errors from "../shared/utils/errors.js";
import { sendEmail } from "../shared/services/email.js";

import { uploadAvatar, deleteFile } from "../shared/services/upload.js";

/* ---------- Authentication ---------- */

export async function register(req, res, next) {
  try {
    let { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      throw new Errors.ValidationError("Email, password, and full name are required.");
    }

    const existing = await User.findOne({ email });

    if (existing) {
      throw new Errors.ConflictError(
        "An account with this email already exists.",
      );
    }

    // Generate a unique username from email
    let username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
    if (username.length < 3) username = "user";

    // Ensure uniqueness
    let usernameSuffix = 0;
    let finalUsername = username;
    while (await User.exists({ username: finalUsername })) {
      usernameSuffix++;
      finalUsername = `${username}_${usernameSuffix}`.slice(0, 30);
    }

    let avatar = {
      url: "",
      publicId: "",
    };

    if (req.file) {
      const uploaded = await uploadAvatar(req.file.buffer);

      avatar = {
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
    }

    const user = await User.create({
      email,
      username: finalUsername,
      auth: { passwordHash: password },
      fullName,
      avatar,
    });

    const token = generateToken({
      role: "user",
      userId: user.id,
    });

    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+auth.passwordHash");

    if (!user) {
      throw new Errors.AuthenticationError("Invalid email or password.");
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      throw new Errors.AuthenticationError("Invalid email or password.");
    }

    const token = generateToken({
      role: "user",
      userId: user.id,
    });

    setTokenCookie(res, token);

    return res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Profile ---------- */

export async function getMe(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new Errors.AuthenticationError("Authentication required.");
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new Errors.NotFoundError("User not found.");
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new Errors.AuthenticationError("Authentication required.");
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new Errors.NotFoundError("User not found.");
    }

    const { fullName } = req.body;

    if (fullName !== undefined) {
      user.fullName = fullName;
    }

    if (req.file) {
      const uploaded = await uploadAvatar(req.file.buffer);

      if (user.avatar?.publicId) {
        await deleteFile(user.avatar.publicId);
      }

      user.avatar = {
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
    }

    await user.save();

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMe(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new Errors.AuthenticationError("Authentication required.");
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new Errors.NotFoundError("User not found.");
    }

    if (user.avatar?.publicId) {
      await deleteFile(user.avatar.publicId);
    }

    await user.deleteOne();

    clearTokenCookie(res);

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
    const user = await User.findById(req.params.userId)
      .select("fullName avatar createdAt")
      .lean();

    if (!user) {
      throw new Errors.NotFoundError("User not found.");
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Password Reset (OTP-based) ---------- */

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new Errors.ValidationError("Email is required.");
    }

    // Always return success to avoid revealing whether the email exists
    const user = await User.findOne({ email }).select(
      "+auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified"
    );

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.auth.passwordResetOTP = otp;
      user.auth.passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.auth.passwordResetVerified = false;

      await user.save();

      await sendEmail({
        to: user.email,
        subject: "LifeBookz - Password Reset OTP",
        text: `You requested a password reset for your LifeBookz account.\n\nYour OTP is:\n\n${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest,\nThe LifeBookz Team`,
      }).catch(() => {});
    }

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
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new Errors.ValidationError("Email and OTP are required.");
    }

    const user = await User.findOne({ email }).select(
      "+auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified"
    );

    if (
      !user ||
      user.auth.passwordResetOTP !== otp ||
      !user.auth.passwordResetOTPExpires ||
      user.auth.passwordResetOTPExpires < new Date()
    ) {
      throw new Errors.ValidationError("Invalid or expired OTP.");
    }

    // Mark OTP as verified and clear it
    user.auth.passwordResetVerified = true;
    user.auth.passwordResetOTPExpires = undefined;

    // Issue a one-time temp token for the reset-password step
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.auth.passwordResetOTP = resetToken;
    user.auth.passwordResetOTPExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min for token

    await user.save();

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
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      throw new Errors.ValidationError("Reset token and new password are required.");
    }

    if (password.length < 8) {
      throw new Errors.ValidationError("Password must be at least 8 characters.");
    }

    const user = await User.findOne({
      "auth.passwordResetOTP": resetToken,
      "auth.passwordResetOTPExpires": { $gt: new Date() },
      "auth.passwordResetVerified": true,
    }).select(
      "+auth.passwordHash +auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified"
    );

    if (!user) {
      throw new Errors.ValidationError(
        "Invalid or expired reset token. Please request a new OTP."
      );
    }

    // Update password and clear all reset fields
    user.auth.passwordHash = password;
    user.auth.passwordResetOTP = "";
    user.auth.passwordResetOTPExpires = undefined;
    user.auth.passwordResetVerified = false;

    await user.save();

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    clearTokenCookie(res);

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
}
