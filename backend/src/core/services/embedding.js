import { OpenRouter } from "@openrouter/sdk";
import config from "../config/index.js";

const client = new OpenRouter({
  apiKey: config.openrouter.apiKey,
});

// The SDK may return either the parsed body or a raw JSON string
function toResponseBody(response) {
  if (typeof response !== "string") return response;

  try {
    return JSON.parse(response);
  } catch {
    return { data: [] };
  }
}

export async function generateEmbedding(text) {
  if (!text?.trim()) {
    throw new Error("Text cannot be empty.");
  }

  const response = await client.embeddings.generate({
    // @openrouter/sdk expects the request payload wrapped in `requestBody`
    requestBody: {
      model: config.openrouter.embeddingModel,
      input: text.trim(),
    },
  });

  const body = toResponseBody(response);

  return body.data[0].embedding;
}

export async function generateEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Texts must be a non-empty array.");
  }

  const response = await client.embeddings.generate({
    requestBody: {
      model: config.openrouter.embeddingModel,
      input: texts.map((text) => text.trim()),
    },
  });

  const body = toResponseBody(response);

  return body.data.map((item) => item.embedding);
}
