import { Router } from 'express';
import { authorRegister, authorLogin, authorRefresh } from '../auth/controllers.js';
import { authenticate, authenticateRefresh } from '../auth/middleware.js';
import { getMe, updateMe, getProfile } from './controllers.js';

const router = Router();

router.post('/register', authorRegister);
router.post('/login', authorLogin);
router.post('/refresh', authenticateRefresh, authorRefresh);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.get('/:authorId', getProfile);

export default router;
