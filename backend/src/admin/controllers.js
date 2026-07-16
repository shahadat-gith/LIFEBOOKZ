import config from "../shared/config/index.js";

import Author from "../author/model.js";
import User from "../user/model.js";
import Story from "../story/models/Story.js";

import { generateToken, setTokenCookie, clearTokenCookie } from "../shared/utils/helpers.js";
import * as Errors from "../shared/utils/errors.js";

import { sendApplicationApproved, sendApplicationRejected } from "./utils.js";

/* ---------- Authentication ---------- */

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (email !== config.admin.email || password !== config.admin.password) {
      throw new Errors.AuthenticationError("Invalid admin credentials.");
    }

    const token = generateToken({
      role: "admin",
      key: config.admin.key,
    });

    setTokenCookie(res, token);

    return res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Dashboard ---------- */

export async function dashboard(req, res, next) {
  try {
    const [totalUsers, totalAuthors, totalStories, pendingAuthors] =
      await Promise.all([
        User.countDocuments(),
        Author.countDocuments(),
        Story.countDocuments({ status: "published" }),
        Author.countDocuments({
          "verification.status": "pending",
        }),
      ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalAuthors,
        totalStories,
        pendingAuthors,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Authors ---------- */

export async function getPendingAuthors(req, res, next) {
  try {
    const authors = await Author.find({
      "verification.status": "pending",
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      data: authors,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveAuthor(req, res, next) {
  try {
    const author = await Author.findById(req.params.authorId);

    if (!author) {
      throw new Errors.NotFoundError("Author not found.");
    }

    author.verification.status = "approved";
    author.verification.verifiedAt = new Date();
    author.verification.rejectionReason = "";

    await author.save();

    // Send email without delaying the response
    sendApplicationApproved(author.email, author.fullName).catch((err) =>
      console.error("Failed to send approval email:", err),
    );

    return res.json({
      success: true,
      message: "Author approved successfully.",
      data: author,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectAuthor(req, res, next) {
  try {
    const { reason } = req.body;

    if (!reason?.trim()) {
      throw new Errors.ValidationError("Rejection reason is required.");
    }

    const author = await Author.findById(req.params.authorId);

    if (!author) {
      throw new Errors.NotFoundError("Author not found.");
    }

    author.verification.status = "rejected";
    author.verification.verifiedAt = new Date();
    author.verification.rejectionReason = reason.trim();

    await author.save();

    // Send email without delaying the response
    sendApplicationRejected(author.email, author.fullName, reason.trim()).catch(
      (err) => console.error("Failed to send rejection email:", err),
    );

    return res.json({
      success: true,
      message: "Author rejected successfully.",
      data: author,
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Users ---------- */

export async function getUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Stories ---------- */

export async function getStories(req, res, next) {
  try {
    const stories = await Story.find()
      .populate("author", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: stories,
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
