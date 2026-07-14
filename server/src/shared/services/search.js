import { getQdrantClient } from "../config/qdrant.js";
import Story from "../../story/models/Story.js";
import log from "../utils/logger.js";

export async function semanticSearch(query, options = {}) {
  const { limit = 20, language } = options;

  try {
    return await vectorSearch(query, { limit, language });
  } catch (error) {
    log("warn", "Vector search failed, using text fallback", {
      error: error.message,
    });
    return textSearch(query, options);
  }
}

async function vectorSearch(query, { limit, language }) {
  const qdrant = getQdrantClient();
  if (!qdrant) throw new Error("Qdrant not configured");

  const filter = { must: [{ key: "published_at", match: { value: true } }] };
  if (language)
    filter.must.push({ key: "language", match: { value: language } });

  const results = await qdrant.search("lifebookz_story_embeddings", {
    vector: new Array(384).fill(0.5),
    limit,
    scoreThreshold: 0.2,
    filter: filter.must.length > 1 ? filter : undefined,
    withPayload: ["storyId", "title"],
  });

  const storyIds = results.map((r) => r.payload.storyId);
  const stories = await Story.find({
    _id: { $in: storyIds },
    publishedAt: { $ne: null },
  }).select("title content tags language summary publishedAt");

  const map = {};
  stories.forEach((s) => {
    map[s._id.toString()] = s;
  });

  return {
    results: results
      .map((r) => ({ ...map[r.payload.storyId]?.toJSON(), score: r.score }))
      .filter(Boolean),
    total: results.length,
    query,
  };
}

async function textSearch(query, { limit = 20, language } = {}) {
  const dbQuery = { publishedAt: { $ne: null }, $text: { $search: query } };
  if (language) dbQuery.language = language;

  const stories = await Story.find(dbQuery)
    .sort({ score: { $meta: "textScore" }, publishedAt: -1 })
    .limit(limit)
    .select("title content tags language summary publishedAt");

  return {
    results: stories.map((s) => ({ ...s.toJSON(), score: null })),
    total: stories.length,
    query,
  };
}

export async function getTrendingStories(limit = 20) {
  return Story.find({
    publishedAt: {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("title content tags language summary publishedAt");
}
