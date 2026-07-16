import User from "./model.js";

import { generateToken, setTokenCookie, clearTokenCookie } from "../shared/utils/helpers.js";
import * as Errors from "../shared/utils/errors.js";

import { uploadAvatar, deleteFile } from "../shared/services/upload.js";

/* ---------- Authentication ---------- */

export async function register(req, res, next) {
  try {
    const { email, password, fullName, interests = [] } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      throw new Errors.ConflictError(
        "An account with this email already exists.",
      );
    }

    const avatar = {};

    if (req.file) {
      const uploaded = await uploadAvatar(req.file.buffer);

      avatar.url = uploaded.url;
      avatar.publicId = uploaded.publicId;
    }

    const user = await User.create({
      email,
      passwordHash: password,
      fullName,
      avatar,
      interests,
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

    const user = await User.findOne({ email }).select("+passwordHash");

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
    const user = await User.findById(req.user.id).lean();

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
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new Errors.NotFoundError("User not found.");
    }

    const { fullName, interests } = req.body;

    if (fullName !== undefined) {
      user.fullName = fullName;
    }

    if (interests !== undefined) {
      user.interests = interests;
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
      .select("fullName avatar interests createdAt")
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
