import Author from "./model.js";
import Story from "../story/models/Story.js";

import {
  generateToken,
  setTokenCookie,
  clearTokenCookie,
} from "../shared/utils/helpers.js";
import * as Errors from "../shared/utils/errors.js";

import { uploadAvatar, deleteFile } from "../shared/services/upload.js";

export async function register(req, res, next) {
  try {
    let {
      email,
      password,
      fullName,
      profession,
      bio,
      website = "",
      socialLinks = {},
    } = req.body;

    if (typeof socialLinks === "string") {
      try {
        socialLinks = JSON.parse(socialLinks);
      } catch {
        throw new Errors.ValidationError("Invalid social links.");
      }
    }

    email = email?.trim().toLowerCase();
    fullName = fullName?.trim();
    profession = profession?.trim();
    bio = bio?.trim();

    if (!email || !password || !fullName || !profession || !bio) {
      throw new Errors.ValidationError("Please fill all required fields.");
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
      avatar = await uploadAvatar(req.file.buffer);
    }

    const author = await Author.create({
      email,
      passwordHash: password,
      fullName,
      profession,
      avatar,
      bio,
      website: website.trim(),
      socialLinks,
    });

    const token = generateToken({
      role: "author",
      authorId: author.id,
    });

    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      data: {
        author,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const author = await Author.findOne({ email }).select("+passwordHash");

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

    setTokenCookie(res, token);

    return res.json({
      success: true,
      data: {
        author,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
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
    const author = await Author.findById(req.user.id);

    if (!author) {
      throw new Errors.NotFoundError("Author not found.");
    }

    let { fullName, profession, bio, website, socialLinks } = req.body;

    // Parse socialLinks from JSON string when sent via FormData
    if (typeof socialLinks === "string") {
      try {
        socialLinks = JSON.parse(socialLinks);
      } catch {
        socialLinks = undefined;
      }
    }

    if (fullName !== undefined) author.fullName = fullName;
    if (profession !== undefined) author.profession = profession;
    if (bio !== undefined) author.bio = bio;
    if (website !== undefined) author.website = website;

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
        "fullName profession avatar verification bio website socialLinks createdAt",
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
