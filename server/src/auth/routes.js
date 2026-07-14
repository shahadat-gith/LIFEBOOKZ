import { Router } from 'express';
import {
  register, login, getMe,
} from './controllers.js';
import { authenticate } from './middleware.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
