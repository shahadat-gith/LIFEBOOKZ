import Story from "../story/models/Story.js";
import Like from "../story/models/Like.js";
import Author from "../author/model.js";
import Follow from "../following/model.js";

import { generateEmbedding } from "../../core/services/embedding.js";
import { getQdrantClient } from "../../core/config/qdrant.js";
import config from "../../core/config/index.js";

const qdrant = getQdrantClient();

// Fields needed by the client feed/search cards
const STORY_SELECT =
  "title slug summary chapters content coverImage author storyType language stats publishedAt createdAt";

/**
 * Vector search over the story collection, hydrated from Mongo and enriched
 * with the viewer's like/follow state.
 *
 * @param {object} params
 * @param {string} params.q          free-text query
 * @param {number} [params.limit]    max results (capped at 50)
 * @param {string} [params.profession] author profession filter
 * @param {string} [params.storyType]  story type filter
 * @param {{id: string, role: string}} [params.viewer]
 */
export async function semanticSearch({
  q,
  limit,
  profession,
  storyType,
  viewer,
}) {
  const query = q?.trim() || "";
  if (!query) return [];

  const safeLimit = Math.min(Number(limit) || 20, 50);

  // 1. Embed the user query
  const embedding = await generateEmbedding(query);

  // 2. Optional payload filters (authorProfession is stored lowercased)
  const must = [];
  if (profession?.trim()) {
    must.push({
      key: "authorProfession",
      match: { value: profession.trim().toLowerCase() },
    });
  }
  if (storyType?.trim()) {
    must.push({ key: "storyType", match: { value: storyType.trim() } });
  }

  // 3. Vector search in Qdrant — the client returns the hits array directly
  const hits = await qdrant.search(config.qdrant.collections.story, {
    vector: embedding,
    limit: safeLimit,
    with_payload: true,
    ...(must.length ? { filter: { must } } : {}),
  });

  const storyIds = hits
    .map((hit) => hit.payload?.storyId || String(hit.id))
    .filter(Boolean);

  // 4. Hydrate from Mongo (only published stories)
  const stories = await Story.find({
    _id: { $in: storyIds },
    status: "published",
  })
    .select(STORY_SELECT)
    .populate("author", "fullName username avatar profession verification.status")
    .lean();

  const storyMap = new Map(stories.map((s) => [s._id.toString(), s]));

  // Preserve vector-search relevance order and attach the score
  const results = hits
    .map((hit) => {
      const story = storyMap.get(String(hit.payload?.storyId || hit.id));
      return story ? { ...story, score: hit.score } : null;
    })
    .filter(Boolean);

  // Enrich like/follow state for authenticated users (matches feed UX)
  const likedMap = {};
  const followingMap = {};

  if (viewer?.id && viewer.role === "user") {
    const resultStoryIds = results.map((s) => s._id.toString());
    const authorIds = results
      .map((s) => s.author?._id?.toString())
      .filter(Boolean);

    if (resultStoryIds.length > 0) {
      const likes = await Like.find({
        story: { $in: resultStoryIds },
        user: viewer.id,
      }).lean();
      likes.forEach((like) => {
        likedMap[like.story.toString()] = true;
      });
    }

    if (authorIds.length > 0) {
      const follows = await Follow.find({
        who: viewer.id,
        whom: { $in: authorIds },
      }).lean();
      follows.forEach((follow) => {
        followingMap[follow.whom.toString()] = true;
      });
    }
  }

  return results.map((story) => ({
    ...story,
    likedByUser: likedMap[story._id.toString()] || false,
    followingAuthor: followingMap[story.author?._id?.toString()] || false,
  }));
}

/**
 * Distinct professions across approved, active authors (most common first).
 */
export async function listProfessions() {
  const professions = await Author.aggregate([
    {
      $match: {
        "verification.status": "approved",
        status: "active",
        profession: { $type: "string", $ne: "" },
      },
    },
    {
      $group: {
        _id: { $toLower: "$profession" },
        label: { $first: "$profession" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, label: 1 } },
    { $limit: 50 },
  ]);

  return professions.map((p) => ({
    value: p._id,
    label: p.label,
    count: p.count,
  }));
}
