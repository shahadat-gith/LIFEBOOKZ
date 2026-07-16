import OpenRouter from "@openrouter/sdk";
import config from "../config/index.js";

const client = new OpenRouter({
  apiKey: config.openrouter.apiKey,
});

export async function generateEmbedding(text) {
  if (!text?.trim()) {
    throw new Error("Text cannot be empty.");
  }

  const response = await client.embeddings.generate({
    model: config.openrouter.embeddingModel,
    input: text.trim(),
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Texts must be a non-empty array.");
  }

  const response = await client.embeddings.generate({
    model: config.openrouter.embeddingModel,
    input: texts.map((text) => text.trim()),
  });

  return response.data.map((item) => item.embedding);
}