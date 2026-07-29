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

/**
 * Extract plain text from a story document.
 * The document can be either:
 * - A string (HTML content), in which case HTML tags are stripped
 * - An object (TipTap JSON), in which case text is recursively extracted from nodes
 */
export function extractTextFromDocument(document) {
  if (!document) return "";

  // String — treat as HTML, strip tags
  if (typeof document === "string") {
    return document
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\u00A0/g, " ")
      .trim();
  }

  // Object — TipTap/Mixed JSON node tree
  if (typeof document === "object") {
    return extractTextFromNode(document);
  }

  return String(document);
}

function extractTextFromNode(node) {
  if (!node) return "";

  // Leaf text node
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }

  // Node with children
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).filter(Boolean).join(" ").trim();
  }

  return "";
}
