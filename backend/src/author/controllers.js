import crypto from "crypto";
import Author from "./model.js";
import Story from "../story/models/Story.js";

import { generateToken } from "../shared/utils/helpers.js";
import config from "../shared/config/index.js";
import * as Errors from "../shared/utils/errors.js";
import { sendEmail } from "../shared/services/email.js";

import { uploadAvatar, deleteFile } from "../shared/services/upload.js";

export async function register(req, res, next) {
  try {
    let {
      email,
      password,
      fullName,
      username,
      profession,
      bio,
      phone,
      dob,
      gender,
      address = {},
      socialLinks = {},
    } = req.body;

    // Parse JSON strings that come from FormData
    if (typeof socialLinks === "string") {
      try {
        socialLinks = JSON.parse(socialLinks);
      } catch {
        throw new Errors.ValidationError("Invalid social links.");
      }
    }

    if (typeof address === "string") {
      try {
        address = JSON.parse(address);
      } catch {
        address = {};
      }
    }

    email = email?.trim().toLowerCase();
    fullName = fullName?.trim();
    // Sanitize username: lowercase, strip all but a-z0-9_.-
    username = (username || fullName || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, "")
      .replace(/^[._-]+|[._-]+$/g, "")
      .slice(0, 30);
    profession = profession?.trim();
    bio = bio?.trim();
    phone = phone?.trim();

    if (!email || !password || !fullName || !profession || !bio || !phone || !dob || !gender) {
      throw new Errors.ValidationError("Please fill all required fields (name, email, password, profession, bio, phone, DOB, gender).");
    }

    if (username.length < 3) {
      throw new Errors.ValidationError("Username must be at least 3 characters.");
    }

    const existing = await Author.exists({ email });

    if (existing) {
      throw new Errors.ConflictError(
        "An author with this email already exists.",
      );
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

    const author = await Author.create({
      email,
      username,
      auth: { passwordHash: password },
      fullName,
      profession,
      phone,
      dob: new Date(dob),
      gender,
      avatar,
      bio,
      address: {
        country: address.country || "",
        state: address.state || "",
        city: address.city || "",
        zipCode: address.zipCode || "",
      },
      socialLinks: {
        website: socialLinks.website || "",
        x: socialLinks.x || "",
        instagram: socialLinks.instagram || "",
        facebook: socialLinks.facebook || "",
        linkedin: socialLinks.linkedin || "",
        youtube: socialLinks.youtube || "",
      },
    });

    const token = generateToken({
      role: "author",
      authorId: author.id,
    });

    res.status(201).json({
      success: true,
      data: {
        author,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const author = await Author.findOne({ email }).select("+auth.passwordHash");

    if (!author) {
      throw new Errors.AuthenticationError("Invalid email or password.");
    }

    const isValid = await author.comparePassword(password);

    if (!isValid) {
      throw new Errors.AuthenticationError("Invalid email or password.");
    }

    if (author.verification.status === "rejected") {
      throw new Errors.AuthenticationError(
        "Your author account has been rejected.",
      );
    }

    if (author.verification.status !== "approved") {
      throw new Errors.AuthenticationError(
        "Your author account is awaiting approval.",
      );
    }

    const token = generateToken({
      role: "author",
      authorId: author.id,
    });

    return res.json({
      success: true,
      data: {
        author,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new Errors.AuthenticationError("Authentication required.");
    }

    const author = await Author.findById(req.user.id).lean();

    if (!author) {
      throw new Errors.NotFoundError("Author not found.");
    }

    return res.json({
      success: true,
      data: author,
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

    const author = await Author.findById(req.user.id);

    if (!author) {
      throw new Errors.NotFoundError("Author not found.");
    }

    let { fullName, profession, bio, phone, dob, gender, address, socialLinks } = req.body;

    // Parse JSON strings when sent via FormData
    if (typeof socialLinks === "string") {
      try {
        socialLinks = JSON.parse(socialLinks);
      } catch {
        socialLinks = undefined;
      }
    }

    if (typeof address === "string") {
      try {
        address = JSON.parse(address);
      } catch {
        address = undefined;
      }
    }

    if (fullName !== undefined) author.fullName = fullName;
    if (profession !== undefined) author.profession = profession;
    if (bio !== undefined) author.bio = bio;
    if (phone !== undefined) author.phone = phone;
    if (dob !== undefined) author.dob = new Date(dob);
    if (gender !== undefined) author.gender = gender;

    if (address) {
      author.address = {
        ...(author.address || {}),
        ...address,
      };
    }

    if (socialLinks) {
      author.socialLinks = {
        ...(author.socialLinks || {}),
        ...socialLinks,
      };
    }

    if (req.file) {
      const uploaded = await uploadAvatar(req.file.buffer);

      if (author.avatar?.publicId) {
        await deleteFile(author.avatar.publicId);
      }

      author.avatar = {
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
    }

    await author.save();

    return res.json({
      success: true,
      data: author,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const author = await Author.findById(req.params.authorId)
      .select(
        "fullName username profession avatar verification bio socialLinks address phone dob gender stats createdAt",
      )
      .lean();

    if (!author) {
      throw new Errors.NotFoundError("Author not found.");
    }

    return res.json({
      success: true,
      data: author,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyStories(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new Errors.AuthenticationError("Authentication required.");
    }

    const stories = await Story.find({
      author: req.user.id,
    })
      .sort({
        updatedAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    next(error);
  }
}

export async function listApproved(req, res, next) {
  try {
    const authors = await Author.find({
      "verification.status": "approved",
    })
      .select("fullName profession avatar bio createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Get story counts for each author
    const authorIds = authors.map((a) => a._id);

    let countMap = {};

    if (authorIds.length > 0) {
      const storyCounts = await Story.aggregate([
      { $match: { author: { $in: authorIds }, status: "published" } },
      { $group: { _id: "$author", count: { $sum: 1 } } },
    ]);

      storyCounts.forEach((s) => {
        countMap[s._id.toString()] = s.count;
      });
    }

    const enriched = authors.map((a) => ({
      ...a,
      storyCount: countMap[a._id.toString()] || 0,
    }));

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyStory(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new Errors.AuthenticationError("Authentication required.");
    }

    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    }).lean();

    if (!story) {
      throw new Errors.NotFoundError("Story not found.");
    }

    return res.json({
      success: true,
      data: story,
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

    const author = await Author.findOne({ email }).select(
      "+auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified"
    );

    if (author) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      author.auth.passwordResetOTP = otp;
      author.auth.passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      author.auth.passwordResetVerified = false;

      await author.save();

      await sendEmail({
        to: author.email,
        subject: "LifeBookz - Author Password Reset OTP",
        text: `You requested a password reset for your LifeBookz author account.\n\nYour OTP is:\n\n${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest,\nThe LifeBookz Team`,
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

    const author = await Author.findOne({ email }).select(
      "+auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified"
    );

    if (
      !author ||
      author.auth.passwordResetOTP !== otp ||
      !author.auth.passwordResetOTPExpires ||
      author.auth.passwordResetOTPExpires < new Date()
    ) {
      throw new Errors.ValidationError("Invalid or expired OTP.");
    }

    author.auth.passwordResetVerified = true;
    author.auth.passwordResetOTPExpires = undefined;

    const resetToken = crypto.randomBytes(32).toString("hex");
    author.auth.passwordResetOTP = resetToken;
    author.auth.passwordResetOTPExpires = new Date(Date.now() + 5 * 60 * 1000);

    await author.save();

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

    const author = await Author.findOne({
      "auth.passwordResetOTP": resetToken,
      "auth.passwordResetOTPExpires": { $gt: new Date() },
      "auth.passwordResetVerified": true,
    }).select(
      "+auth.passwordHash +auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified"
    );

    if (!author) {
      throw new Errors.ValidationError(
        "Invalid or expired reset token. Please request a new OTP."
      );
    }

    author.auth.passwordHash = password;
    author.auth.passwordResetOTP = "";
    author.auth.passwordResetOTPExpires = undefined;
    author.auth.passwordResetVerified = false;

    await author.save();

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
