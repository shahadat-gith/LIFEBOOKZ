import { Router } from 'express';
import userRouter from '../user/routes.js';
import authorRoutes from '../author/routes.js';
import adminRoutes from '../admin/routes.js';
import storyRoutes from '../story/routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), version: '1.0.0' });
});

router.use('/users', userRouter);
router.use('/authors', authorRoutes);
router.use('/admin', adminRoutes);
router.use('/stories', storyRoutes);


export default router;
