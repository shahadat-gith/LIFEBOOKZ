import Author from "./model.js";
import { generateAuthorAccessToken } from "../shared/utils/auth.js";
import { AuthenticationError, ConflictError } from "../shared/utils/errors.js";
import * as uploadService from "../shared/services/upload.js";
import { publishMessage } from "../shared/sqs/publishers.js";

export async function authorRegister(req, res, next) {
  try {
    const {
      email,
      password,
      fullName,
      bio = "",
      website = "",
      socialLinks = {},
    } = req.body;

    const existing = await Author.findOne({ email });

    if (existing) {
      throw new ConflictError("An author with this email already exists.");
    }

    const avatar = {};

    if (req.file) {
      const result = await uploadService.uploadImage(req.file.buffer);
      avatar.url = result.url;
      avatar.publicId = result.publicId;
    }

    const author = await Author.create({
      email,
      passwordHash: password,
      fullName,
      avatar,
      bio,
      website,
      socialLinks,
    });

    await publishMessage({
      jobType: "author_embedding",
      authorId: author.id,
    });

    const accessToken = generateAuthorAccessToken(author);

    return res.status(201).json({
      author: author.toJSON(),
      accessToken,
      message: "Author registered successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function authorLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const author = await Author.findOne({ email }).select("+passwordHash");

    if (!author) {
      throw new AuthenticationError("Invalid email!");
    }

    const isValid = await author.comparePassword(password);

    if (!isValid) {
      throw new AuthenticationError("Invalid password.");
    }

    if (author.verification.status === "rejected") {
      throw new AuthenticationError("Your author account has been rejected.");
    }

    if (author.verification.status !== "approved") {
      throw new AuthenticationError(
        "Your author account is awaiting approval.",
      );
    }

    const accessToken = generateAuthorAccessToken(author);

    return res.json({
      author: author.toJSON(),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const author = await Author.findById(req.user.id);

    if (!author) {
      throw new NotFoundError("Author not found.");
    }

    res.json(author);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const author = await Author.findById(req.user.id);

    if (!author) {
      throw new NotFoundError("Author not found.");
    }

    const { fullName, bio, website, socialLinks } = req.body;

    if (fullName !== undefined) author.fullName = fullName;
    if (bio !== undefined) author.bio = bio;
    if (website !== undefined) author.website = website;

    if (socialLinks) {
      author.socialLinks = {
        ...author.socialLinks.toObject(),
        ...socialLinks,
      };
    }

    if (req.file) {
      if (author.avatar?.publicId) {
        await uploadService.deleteImage(author.avatar.publicId);
      }

      const uploaded = await uploadService.uploadImage(req.file.buffer);

      author.avatar = {
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
    }

    await author.save();

    await publishMessage({
      jobType: "author_embedding",
      authorId: author.id,
    });

    res.json(author);
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const author = await Author.findById(req.params.authorId);

    if (!author) {
      throw new NotFoundError("Author not found.");
    }

    res.json(author);
  } catch (error) {
    next(error);
  }
}
