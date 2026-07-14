import { Router } from 'express';
import upload from '../shared/middlewares/multer.js';
import { getMe, updateMe, deleteMe, updateMyPreferences, getMyStats, getUserProfile } from './controllers.js';
import { authenticate, authenticateOptional } from '../auth/middleware.js';

const userRouter = Router();

userRouter.get('/me', authenticate, getMe);
userRouter.patch('/me', authenticate, upload.single('avatar'), updateMe);
userRouter.delete('/me', authenticate, deleteMe);
userRouter.put('/me/preferences', authenticate, updateMyPreferences);
userRouter.get('/me/stats', authenticate, getMyStats);
userRouter.get('/:userId', authenticateOptional, getUserProfile);

export default userRouter;
