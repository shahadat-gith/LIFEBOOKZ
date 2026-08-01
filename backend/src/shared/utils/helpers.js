import jwt from "jsonwebtoken";
import config from "../config/index.js";

export function generateToken(payload) {
  // Token lifetime is 7 days.
  return jwt.sign(payload, config.jwt.secret, { expiresIn: "7d" });
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
