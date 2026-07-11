import * as storyService from './services.js';
import { enhanceStory, generateTitleSuggestions } from '../shared/services/ai.js';

export async function create(req, res, next) {
  try {
    const result = await storyService.createStory(req.author._id, req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
}

export async function resubmit(req, res, next) {
  try {
    const result = await storyService.resubmitStory(req.params.storyId, req.author._id, req.body);
    res.json(result);
  } catch (e) { next(e); }
}

export async function list(req, res, next) {
  try {
    const { limit, cursor, language, tags, authorId } = req.query;
    res.json(await storyService.listStories({ limit: parseInt(limit) || 20, cursor, language, tags, authorId }));
  } catch (e) { next(e); }
}

export async function getById(req, res, next) {
  try {
    const viewerId = req.user?._id || req.author?._id;
    res.json(await storyService.getStoryById(req.params.storyId, viewerId));
  } catch (e) { next(e); }
}

export async function update(req, res, next) {
  try {
    res.json(await storyService.updateStory(req.params.storyId, req.author._id, req.body));
  } catch (e) { next(e); }
}

export async function remove(req, res, next) {
  try {
    res.json(await storyService.deleteStory(req.params.storyId, req.author._id));
  } catch (e) { next(e); }
}

export async function like(req, res, next) {
  try {
    res.json(await storyService.toggleLike(req.params.storyId, req.user._id));
  } catch (e) { next(e); }
}

export async function listComments(req, res, next) {
  try {
    const { limit, cursor } = req.query;
    res.json(await storyService.getStoryComments(req.params.storyId, { limit: parseInt(limit) || 20, cursor }));
  } catch (e) { next(e); }
}

export async function addComment(req, res, next) {
  try {
    const { content } = req.body;
    res.status(201).json(await storyService.addComment(req.params.storyId, req.user._id, content));
  } catch (e) { next(e); }
}

export async function enhance(req, res, next) {
  try {
    const { story } = await storyService.getStoryById(req.params.storyId, req.author._id);
    const ownerId = story.author?._id?.toString() || story.author?.toString();
    if (ownerId !== req.author._id.toString()) {
      return res.status(403).json({ message: 'Only the author can enhance' });
    }
    const enhanced = await enhanceStory(story.content, story.title);
    res.json({ original: story.content, enhanced });
  } catch (e) { next(e); }
}

export async function titleSuggestions(req, res, next) {
  try {
    const result = await storyService.getStoryById(req.params.storyId, req.author?._id);
    if (!result) return res.status(404).json({ message: 'Story not found' });
    const suggestions = await generateTitleSuggestions(result.story.content);
    res.json({ suggestions });
  } catch (e) { next(e); }
}
