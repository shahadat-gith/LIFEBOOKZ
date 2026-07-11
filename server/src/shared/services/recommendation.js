import Story from '../../story/models/Story.js';

export async function getPersonalizedFeed(userId, { limit = 20 } = {}) {
  return Story.find({ publishedAt: { $ne: null } })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title content tags language summary publishedAt');
}

export async function getSimilarStories(storyId, limit = 10) {
  const story = await Story.findById(storyId).select('tags');
  if (!story) return [];

  return Story.find({
    _id: { $ne: storyId },
    publishedAt: { $ne: null },
    tags: { $in: story.tags },
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title content tags language summary publishedAt');
}

