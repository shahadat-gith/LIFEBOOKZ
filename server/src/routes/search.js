import { Router } from 'express';
import { semanticSearch, getTrendingStories } from '../shared/services/search.js';
import { getPersonalizedFeed, getSimilarStories } from '../shared/services/recommendation.js';
import { authenticate, authenticateOptional } from '../auth/middleware.js';

const router = Router();

router.get('/', authenticateOptional, async (req, res, next) => {
  try {
    const { q, limit, language, category } = req.query;
    if (!q) return res.status(400).json({ message: 'Query "q" is required' });
    res.json(await semanticSearch(q, { limit: parseInt(limit) || 20, language, category }));
  } catch (e) { next(e); }
});

router.get('/trending', async (req, res, next) => {
  try { res.json({ results: await getTrendingStories(parseInt(req.query.limit) || 20) }); }
  catch (e) { next(e); }
});

router.get('/feed', authenticate, async (req, res, next) => {
  try { res.json({ results: await getPersonalizedFeed(req.user._id, { limit: parseInt(req.query.limit) || 20 }) }); }
  catch (e) { next(e); }
});

router.get('/similar/:storyId', authenticateOptional, async (req, res, next) => {
  try { res.json({ results: await getSimilarStories(req.params.storyId, parseInt(req.query.limit) || 10) }); }
  catch (e) { next(e); }
});



export default router;
