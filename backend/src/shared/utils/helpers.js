import jwt from "jsonwebtoken";
import config from "../config/index.js";

export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret);
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.env === "production",
  sameSite: config.env === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export function setTokenCookie(res, token) {
  res.cookie("token", token, COOKIE_OPTIONS);
}

export function clearTokenCookie(res) {
  res.clearCookie("token", { path: "/" });
}
