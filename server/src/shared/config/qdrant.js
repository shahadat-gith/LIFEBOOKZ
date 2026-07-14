import { QdrantClient } from "@qdrant/js-client-rest";
import config from "./index.js";

let client;

export function getQdrantClient() {
  if (!client) {
    client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
  }

  return client;
}

async function createCollections() {
  const client = getQdrantClient();

  const collections = [
    {
      name: "lifebookz_user_embeddings",
      vectors: {
        size: 512,
        distance: "Cosine",
      },
    },
    {
      name: "lifebookz_story_embeddings",
      vectors: {
        size: 512,
        distance: "Cosine",
      },
    },
  ];

  const { collections: existingCollections } = await client.getCollections();
  const existingNames = new Set(existingCollections.map(({ name }) => name));

  for (const collection of collections) {
    if (existingNames.has(collection.name)) continue;

    await client.createCollection(collection.name, {
      vectors: collection.vectors,
      hnsw_config: {
        m: 16,
        ef_construct: 128,
      },
    });

    console.log(`✅ Created collection "${collection.name}"`);
  }
}


