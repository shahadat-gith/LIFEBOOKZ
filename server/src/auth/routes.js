import { Router } from 'express';
import {
  register, login, refresh, logout, googleAuth, googleCallback, getMe,
} from './controllers.js';
import { authenticate, authenticateRefresh } from './middleware.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', authenticateRefresh, refresh);
authRouter.post('/logout', logout);
authRouter.get('/google', googleAuth);
authRouter.get('/google/callback', googleCallback);
authRouter.get('/me', authenticate, getMe);
