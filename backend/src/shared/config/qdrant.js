import { QdrantClient } from "@qdrant/js-client-rest";
import config from "./index.js";

let client = null;

export function getQdrantClient() {
  if (!client) {
    client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
  }

  return client;
}

export async function createCollections() {
  try {
    const client = getQdrantClient();

    const collections = [
      config.qdrant.collections.user,
      config.qdrant.collections.story,
    ];

    const { collections: existing } = await client.getCollections();
    const existingNames = new Set(existing.map((c) => c.name));

    for (const name of collections) {
      if (existingNames.has(name)) continue;

      await client.createCollection(name, {
        vectors: {
          size: config.qdrant.vectorSize,
          distance: "Cosine",
        },
        hnsw_config: {
          m: 16,
          ef_construct: 128,
        },
      });

      console.log(`✅ Created Qdrant collection: ${name}`);
    }
  } catch (error) {
    console.error("❌ Failed to initialize Qdrant collections:", error);
    throw error;
  }
}