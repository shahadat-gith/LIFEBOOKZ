import { createHash } from "crypto";
import { QdrantClient } from "@qdrant/js-client-rest";
import Story from '../../story/models/Story.js';
import config from '../../config/index.js';

let qdrant;

function getQdrant() {
  if (qdrant) return qdrant;
  qdrant = new QdrantClient({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey,
  });
  return qdrant;
}

async function generateEmbedding(text) {
  const dims = 384;
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  for (const word of words) {
    const hash = createHash('sha256').update(word).digest();
    for (let i = 0; i < dims; i++) vec[i] += (hash[i % 32] / 255) * 2 - 1;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag > 0) for (let i = 0; i < dims; i++) vec[i] /= mag;
  return vec;
}

export const processEmbeddingJob = async (storyId) => {
  try {
    const story = await Story.findById(storyId);
    if (!story) throw new Error('Story not found');

    // Use story summary for embedding (generated during verification)
    const contentForEmbedding = story.summary || story.title;

    const vector = await generateEmbedding(contentForEmbedding);

    const q = getQdrant();
    await q.upsert('lifebookz_story_embeddings', {
      wait: true,
      points: [{
        id: storyId,
        vector,
        payload: {
          storyId,
          title: story.title,
          authorId: story.author?.toString() || '',
          language: story.language || 'en',
          tags: story.tags || [],
          publishedAt: story.publishedAt?.toISOString() || null,
          published_at: !!story.publishedAt,
        },
      }],
    });

    await Story.updateOne(
      { _id: story._id },
      { $set: { embeddingId: storyId } }
    );

    console.log(`✅ Story ${storyId} embedded successfully.`);
  } catch (error) {
    console.error(`❌ Embedding ${storyId} failed:`, error);
    throw error;
  }
};
