import { Router } from 'express';
import { getMe, updateMe, deleteMe, updateMyPreferences, getMyStats, getUserProfile } from './controllers.js';
import { authenticate, authenticateOptional } from '../auth/middleware.js';

const userRouter = Router();

userRouter.get('/me', authenticate, getMe);
userRouter.patch('/me', authenticate, updateMe);
userRouter.delete('/me', authenticate, deleteMe);
userRouter.put('/me/preferences', authenticate, updateMyPreferences);
userRouter.get('/me/stats', authenticate, getMyStats);
userRouter.get('/:userId', authenticateOptional, getUserProfile);

export default userRouter;
