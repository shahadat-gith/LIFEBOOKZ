import Story from "../story/models/Story.js";
import Like from "../story/models/Like.js";
import Author from "../author/model.js";
import Follow from "../following/model.js";

import { generateEmbedding } from "../shared/services/embedding.js";
import { getQdrantClient } from "../shared/config/qdrant.js";
import config from "../shared/config/index.js";

const qdrant = getQdrantClient();

// Fields needed by the client feed/search cards
const STORY_SELECT =
  "title slug summary content coverImage author storyType language stats publishedAt createdAt";


export async function semanticSearch(req, res, next) {
  try {
    const q = req.query.q?.trim() || "";
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const profession = req.query.profession?.trim() || "";
    const storyType = req.query.storyType?.trim() || "";

    if (!q) {
      return res.json({
        success: true,
        data: { results: [], total: 0 },
      });
    }

    // 1. Embed the user query
    const embedding = await generateEmbedding(q);

    // 2. Optional payload filters (authorProfession is stored lowercased)
    const must = [];
    if (profession) {
      must.push({
        key: "authorProfession",
        match: { value: profession.toLowerCase() },
      });
    }
    if (storyType) {
      must.push({
        key: "storyType",
        match: { value: storyType },
      });
    }

    // 3. Vector search in Qdrant — the client returns the hits array directly
    const hits = await qdrant.search(config.qdrant.collections.story, {
      vector: embedding,
      limit,
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
      .populate("author", "fullName username avatar profession")
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
    let likedMap = {};
    let followingMap = {};
    if (req.user && req.role === "user") {
      const storyIds = results.map((s) => s._id.toString());
      const authorIds = results
        .map((s) => s.author?._id?.toString())
        .filter(Boolean);

      if (storyIds.length > 0) {
        const likes = await Like.find({
          story: { $in: storyIds },
          user: req.user.id,
        }).lean();
        likes.forEach((l) => {
          likedMap[l.story.toString()] = true;
        });
      }

      if (authorIds.length > 0) {
        const follows = await Follow.find({
          who: req.user.id,
          whom: { $in: authorIds },
        }).lean();
        follows.forEach((f) => {
          followingMap[f.whom.toString()] = true;
        });
      }
    }

    const enriched = results.map((s) => ({
      ...s,
      likedByUser: likedMap[s._id.toString()] || false,
      followingAuthor: followingMap[s.author?._id?.toString()] || false,
    }));

    res.json({
      success: true,
      data: {
        results: enriched,
        total: enriched.length,
      },
    });
  } catch (error) {
    next(error);
  }
}


export async function getProfessions(req, res, next) {
  try {
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

    res.json({
      success: true,
      data: professions.map((p) => ({
        value: p._id,
        label: p.label,
        count: p.count,
      })),
    });
  } catch (error) {
    next(error);
  }
}
