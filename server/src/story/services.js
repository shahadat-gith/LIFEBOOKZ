import Story from './models/Story.js';
import Like from './models/Like.js';
import Comment from './models/Comment.js';
import Verification from './models/Verification.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../shared/utils/errors.js';
import { createCursor, decodeCursor } from '../shared/utils/helpers.js';
import { analyzeStoryContent, correctGrammar, extractEmbeddingSummary } from '../shared/services/ai.js';
import { publishEmbeddingEvent } from '../shared/sqs/publishers.js';
import log from '../shared/utils/logger.js';

/**
 * Run AI verification on a story.
 * If clean: corrects grammar, generates summary, sets verification status to 'final'.
 * If issues found: stores issues, keeps verification status as 'issues_found'.
 */
async function runVerification(story) {
  let verification = await Verification.findOne({ story: story._id });
  if (!verification) {
    verification = await Verification.create({ story: story._id, status: 'in_progress' });
  } else {
    verification.status = 'in_progress';
    verification.issues = [];
    await verification.save();
  }

  try {
    const analysis = await analyzeStoryContent(story.content, story.title);

    // Issues found – save as draft
    if (analysis.issues && analysis.issues.length > 0) {
      verification.issues = analysis.issues.map(i => ({
        category: i.category,
        severity: i.severity || 'medium',
        description: i.description,
        suggestion: i.suggestion || '',
      }));
      verification.status = 'issues_found';
      await verification.save();

      return {
        story,
        verification,
        status: 'draft',
        aiFeedback: {
          issues: analysis.issues,
          overallAssessment: analysis.overallAssessment,
          message: 'Some issues were found. Please review the feedback and update your story.',
        },
      };
    }

    // No issues – correct grammar and verify
    const correctedContent = await correctGrammar(story.content, story.title);
    const summary = await extractEmbeddingSummary(correctedContent, story.title);

    // Update story with corrected content and summary, then mark as published
    story.content = correctedContent;
    story.summary = summary;
    story.publishedAt = story.publishedAt || new Date();
    await story.save();

    // Update verification record
    verification.status = 'final';
    await verification.save();

    // Queue embedding in background
    publishEmbeddingEvent(story._id.toString())
      .catch(err => log('error', 'Embedding event failed', { error: err.message, storyId: story._id }));

    return {
      story,
      verification,
      status: 'final',
      grammarCorrected: true,
      message: 'Story verified and published.',
    };
  } catch (error) {
    // AI analysis failed – keep verification pending
    verification.status = 'pending';
    await verification.save();

    log('error', 'AI verification failed', { error: error.message, storyId: story._id });

    return {
      story,
      verification,
      status: 'pending',
      message: 'Could not complete verification. The story has been saved. Please try again later.',
    };
  }
}

export async function createStory(authorId, data) {
  const story = await Story.create({
    author: authorId,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    language: data.language || 'en',
    bannerImage: data.bannerImage,
  });

  return runVerification(story);
}

export async function resubmitStory(storyId, authorId, updatedData) {
  const story = await Story.findOne({ _id: storyId });
  if (!story) throw new NotFoundError('Story not found');
  if (story.author.toString() !== authorId.toString()) throw new AuthorizationError('Not your story');

  if (updatedData.title) story.title = updatedData.title;
  if (updatedData.content) story.content = updatedData.content;
  if (updatedData.tags) story.tags = updatedData.tags;

  // Clear publishedAt so story is not publicly visible during re-verification
  story.publishedAt = undefined;
  await story.save();

  return runVerification(story);
}

export async function getStoryById(storyId, userId = null) {
  const story = await Story.findOne({ _id: storyId });
  if (!story) throw new NotFoundError('Story not found');

  // Author can see their own story regardless of publication status
  if (story.author.toString() === userId?.toString()) {
    const verification = await Verification.findOne({ story: storyId });
    return { story, verification };
  }

  // Public can only see published stories
  if (!story.publishedAt) throw new NotFoundError('Story not found');

  // Include public verification info
  const verification = await Verification.findOne({ story: storyId, status: 'final' });
  return {
    story,
    verification: verification
      ? { status: verification.status, issues: verification.issues }
      : null,
  };
}

export async function updateStory(storyId, userId, updates) {
  const story = await Story.findOne({ _id: storyId });
  if (!story) throw new NotFoundError('Story not found');
  if (story.author.toString() !== userId.toString()) throw new AuthorizationError('Not your story');

  ['title', 'content', 'tags', 'language', 'bannerImage'].forEach(f => {
    if (updates[f] !== undefined) story[f] = updates[f];
  });

  // Clear publishedAt so story goes through re-verification
  story.publishedAt = undefined;
  await story.save();

  // Clear previous verification
  await Verification.deleteOne({ story: storyId });

  return story;
}

export async function deleteStory(storyId, userId) {
  const story = await Story.findOne({ _id: storyId });
  if (!story) throw new NotFoundError('Story not found');
  if (story.author.toString() !== userId.toString()) throw new AuthorizationError('Not your story');

  await Promise.all([
    Story.deleteOne({ _id: storyId }),
    Verification.deleteOne({ story: storyId }),
    Like.deleteMany({ story: storyId }),
    Comment.deleteMany({ story: storyId }),
  ]);

  return { message: 'Story deleted' };
}

export async function listStories(options = {}) {
  const { limit = 20, cursor, language, tags, authorId } = options;
  const query = { publishedAt: { $ne: null } };
  if (language) query.language = language;
  if (authorId) query.author = authorId;
  if (tags) query.tags = { $in: tags.split(',').map(t => t.trim()) };
  if (cursor) {
    const d = decodeCursor(cursor);
    if (d?.id) query._id = { $lt: d.id };
  }
  const stories = await Story.find(query)
    .sort({ publishedAt: -1, _id: -1 }).limit(limit + 1);
  const hasMore = stories.length > limit;
  if (hasMore) stories.pop();
  return { stories, nextCursor: hasMore ? createCursor(stories[stories.length - 1]._id) : null, hasMore };
}

// ---- Likes ----

export async function toggleLike(storyId, userId) {
  const story = await Story.findOne({ _id: storyId, publishedAt: { $ne: null } });
  if (!story) throw new NotFoundError('Story not found');

  const existing = await Like.findOne({ story: storyId, user: userId });
  if (existing) {
    await Like.deleteOne({ story: storyId, user: userId });
    return { liked: false };
  } else {
    await Like.create({ story: storyId, user: userId });
    return { liked: true };
  }
}

// ---- Comments ----

export async function addComment(storyId, userId, content) {
  const story = await Story.findOne({ _id: storyId, publishedAt: { $ne: null } });
  if (!story) throw new NotFoundError('Story not found');

  const comment = await Comment.create({ story: storyId, user: userId, content });
  return comment;
}

export async function getStoryComments(storyId, { limit = 20, cursor } = {}) {
  const query = { story: storyId };
  if (cursor) {
    const d = decodeCursor(cursor);
    if (d?.id) query._id = { $lt: d.id };
  }
  const comments = await Comment.find(query)
    .sort({ createdAt: -1 }).limit(limit + 1);
  const hasMore = comments.length > limit;
  if (hasMore) comments.pop();
  return { comments, nextCursor: hasMore ? createCursor(comments[comments.length - 1]._id) : null, hasMore };
}
