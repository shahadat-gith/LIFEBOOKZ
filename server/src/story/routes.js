import { Router } from 'express';
import upload from '../shared/middlewares/multer.js';
import {
  create, resubmit, list, getById, update, remove,
  like, listComments, addComment, enhance, titleSuggestions,
} from './controllers.js';
import { authenticate, authenticateOptional } from '../auth/middleware.js';

const router = Router();

router.post('/', authenticate, upload.single('bannerImage'), create);
router.post('/:storyId/resubmit', authenticate, upload.single('bannerImage'), resubmit);
router.get('/', authenticateOptional, list);
router.get('/:storyId', authenticateOptional, getById);
router.patch('/:storyId', authenticate, upload.single('bannerImage'), update);
router.delete('/:storyId', authenticate, remove);
router.post('/:storyId/like', authenticate, like);
router.get('/:storyId/comments', listComments);
router.post('/:storyId/comments', authenticate, addComment);
router.post('/:storyId/enhance', authenticate, enhance);
router.post('/:storyId/title-suggestions', authenticate, titleSuggestions);

export default router;
