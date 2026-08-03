import jwt from "jsonwebtoken";
import { v5 as uuidv5 } from "uuid";
import config from "../config/index.js";
import Story from "../../story/models/Story.js";

export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: "7d" });
}



const QDRANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export function toQdrantUuid(mongoId) {
  return uuidv5(mongoId.toString(), QDRANT_NAMESPACE);
}

export function parseJsonFromLLM(text) {
  // Strip markdown code blocks if the LLM wraps the json response
  const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleanedText);
}


export async function getStory(storyId) {
  const story = await Story.findById(storyId);

  if (!story) {
    throw new Error(`Story not found: ${storyId}`);
  }

  return story;
}



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



