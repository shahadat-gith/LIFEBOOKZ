import { QdrantClient } from "@qdrant/js-client-rest";
import config from "./index.js";
import { generateEmbedding } from "../services/embedding.js";

let client = null;

export function getQdrantClient() {
  if (!client) {
    client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
      checkCompatibility: false,
    });
  }

  return client;
}
