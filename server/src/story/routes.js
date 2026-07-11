import { Router } from 'express';
import {
  create, resubmit, list, getById, update, remove,
  like, listComments, addComment, enhance, titleSuggestions,
} from './controllers.js';
import { authenticate, authenticateOptional } from '../auth/middleware.js';

const router = Router();

router.post('/', authenticate, create);
router.post('/:storyId/resubmit', authenticate, resubmit);
router.get('/', authenticateOptional, list);
router.get('/:storyId', authenticateOptional, getById);
router.patch('/:storyId', authenticate, update);
router.delete('/:storyId', authenticate, remove);
router.post('/:storyId/like', authenticate, like);
router.get('/:storyId/comments', listComments);
router.post('/:storyId/comments', authenticate, addComment);
router.post('/:storyId/enhance', authenticate, enhance);
router.post('/:storyId/title-suggestions', authenticate, titleSuggestions);

export default router;
