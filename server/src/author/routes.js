import { Router } from 'express';
import upload from '../shared/middlewares/multer.js';
import { authorRegister, authorLogin } from '../auth/controllers.js';
import { authenticate } from '../auth/middleware.js';
import { getMe, updateMe, getProfile } from './controllers.js';

const router = Router();

router.post('/register', authorRegister);
router.post('/login', authorLogin);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, upload.single('avatar'), updateMe);
router.get('/:authorId', getProfile);

export default router;
