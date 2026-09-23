import Story from "../story/models/Story.js";
import Like from "../story/models/Like.js";
import Author from "../author/model.js";
import Follow from "../following/model.js";

// Fields needed by the client feed/search cards
const STORY_SELECT =
  "title slug chapters.order chapters.stories.title chapters.stories.storyType chapters.stories.media bannerImage author language stats publishedAt createdAt";

const AUTHOR_POPULATE =
  "fullName username avatar profession verification.status";

/**
 * Text search over published public lifebooks — the lifebook title and the
 * titles and content of the stories inside them.
 *
 * @param {object} params
 * @param {string} params.q           free-text query
 * @param {number} [params.limit]     max results (capped at 50)
 * @param {string} [params.profession] author profession filter
 * @param {{id: string, role: string}} [params.viewer]
 */
export async function searchStories({ q, limit, profession, viewer }) {
  const query = q?.trim() || "";
  if (!query) return [];

  const safeLimit = Math.min(Number(limit) || 20, 50);

  // Anchored case-insensitive match for profession (stored lowercased)
  const professionFilter = profession?.trim()
    ? {
        authorProfession: new RegExp(
          `^${profession.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      }
    : {};

  const stories = await Story.find({
    status: "published",
    visibility: "public",
    ...professionFilter,
    $or: [
      { title: { $regex: escapeRegex(query), $options: "i" } },
      { "chapters.stories.title": { $regex: escapeRegex(query), $options: "i" } },
      { "chapters.stories.content": { $regex: escapeRegex(query), $options: "i" } },
    ],
  })
    .select(STORY_SELECT)
    .populate("author", AUTHOR_POPULATE)
    .sort({ publishedAt: -1 })
    .limit(safeLimit)
    .lean();

  // Same like/follow decoration the feed cards get.
  const likedMap = {};
  const followingMap = {};

  if (viewer?.id && viewer.role === "user" && stories.length > 0) {
    const storyIds = stories.map((s) => s._id.toString());
    const authorIds = stories
      .map((s) => s.author?._id?.toString())
      .filter(Boolean);

    const [likes, follows] = await Promise.all([
      Like.find({
        story: { $in: storyIds },
        user: viewer.id,
      }).lean(),

      Follow.find({
        who: viewer.id,
        whom: { $in: authorIds },
      }).lean(),
    ]);

    likes.forEach((like) => {
      likedMap[like.story.toString()] = true;
    });

    follows.forEach((follow) => {
      followingMap[follow.whom.toString()] = true;
    });
  }

  return stories.map((story) => ({
    ...story,
    likedByUser: likedMap[story._id.toString()] || false,
    isFollowedByLoggedInUser: followingMap[story.author?._id?.toString()] || false,
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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
