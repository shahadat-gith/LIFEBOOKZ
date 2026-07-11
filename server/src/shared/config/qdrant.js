import { QdrantClient } from '@qdrant/js-client-rest';
import config from './index.js';
import log from '../utils/logger.js';

let client = null;

export function getQdrantClient() {
  if (client) return client;
  if (!config.qdrant.url) {
    log('warn', 'Qdrant URL not configured');
    return null;
  }
  client = new QdrantClient({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey,
  });
  return client;
}

export async function initializeQdrantCollections() {
  const c = getQdrantClient();
  if (!c) return;

  const collections = [
    { name: 'user_embeddings', vectors: { size: 384, distance: 'Cosine' } },
    { name: 'story_embeddings', vectors: { size: 384, distance: 'Cosine' } },
  ];

  for (const col of collections) {
    try {
      await c.getCollection(col.name);
      await log('info', `Qdrant collection "${col.name}" exists`);
    } catch (err) {
      if (err.status === 404) {
        await c.createCollection(col.name, {
          vectors: col.vectors,
          hnsw_config: { m: 16, ef_construct: 128 },
        });
        await log('info', `Qdrant collection "${col.name}" created`);
      } else {
        await log('error', `Qdrant check error: ${err.message}`);
      }
    }
  }
}
