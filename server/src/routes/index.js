import { Router } from 'express';
import { authRouter } from '../auth/routes.js';
import userRouter from '../user/routes.js';
import authorRoutes from '../author/routes.js';
import adminRoutes from '../admin/routes.js';
import storyRoutes from '../story/routes.js';
import searchRoutes from './search.js';
import uploadRoutes from './upload.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), version: '1.0.0' });
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/authors', authorRoutes);
router.use('/admin', adminRoutes);
router.use('/stories', storyRoutes);
router.use('/search', searchRoutes);
router.use('/upload', uploadRoutes);

export default router;
