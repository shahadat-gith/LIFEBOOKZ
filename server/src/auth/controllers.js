import config from "../shared/config/index.js";
import User from "../user/model.js";
import Author from "../author/model.js";
import {
  generateAccessToken,
  sanitizeUser,
  generateAuthorAccessToken,
  generateAdminToken,
} from "./utils.js";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from "../shared/utils/errors.js";
import { sendApplicationSubmitted } from "../shared/services/email.js";

// ---- User Auth ----

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new ConflictError("Email already exists");
    const user = await User.create({
      email,
      name: name || email.split("@")[0],
      passwordHash: password,
    });
    const accessToken = generateAccessToken(user);
    res.status(201).json({ user: sanitizeUser(user), accessToken });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) throw new AuthenticationError("Invalid email or password");
    if (!(await user.comparePassword(password)))
      throw new AuthenticationError("Invalid email or password");
    const accessToken = generateAccessToken(user);
    res.json({ user: sanitizeUser(user), accessToken });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new NotFoundError("User not found");
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
}

// ---- Author Auth ----

export async function authorRegister(req, res, next) {
  try {
    const { email, password, fullName, bio, website, socialLinks, kyc = {} } =
      req.body;
    const existing = await Author.findOne({ email });
    if (existing)
      throw new ConflictError("An author with this email already exists");

    const author = await Author.create({
      email,
      passwordHash: password,
      fullName,
      bio: bio || "",
      website: website || "",
      socialLinks: socialLinks || {},
      kyc: {
        dateOfBirth: kyc.dateOfBirth,
        phoneNumber: kyc.phoneNumber,
        address: kyc.address,
        governmentId: kyc.governmentId,
      },
      verification: { status: 'pending' },
    });

    sendApplicationSubmitted(author.email, author.fullName).catch(() => {});

    const accessToken = generateAuthorAccessToken(author);
    res.status(201).json({
      author: author.toJSON(),
      accessToken,
      message: "Application submitted! You will be notified once it is reviewed.",
    });
  } catch (e) {
    next(e);
  }
}

export async function authorLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const author = await Author.findOne({ email }).select("+passwordHash");
    if (!author)
      throw new AuthenticationError("Invalid email or password");
    if (!(await author.comparePassword(password)))
      throw new AuthenticationError("Invalid email or password");
    if (author.verification?.status === "rejected")
      throw new AuthenticationError("Your author application has been rejected");
    if (author.verification?.status !== "approved")
      throw new AuthenticationError("Your author account has not been approved yet");

    const accessToken = generateAuthorAccessToken(author);
    res.json({ author: author.toJSON(), accessToken });
  } catch (e) {
    next(e);
  }
}

// ---- Admin Auth ----

export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (email !== config.admin.email || password !== config.admin.password) {
      throw new AuthenticationError("Invalid admin credentials");
    }
    const token = generateAdminToken();
    res.json({ token, admin: { email: config.admin.email } });
  } catch (e) {
    next(e);
  }
}
