import { Router } from 'express';
import upload from '../shared/middlewares/multer.js';

import { authenticate } from '../shared/middleware/auth.js';

const router = Router();

router.post('/', authenticate, upload.single('bannerImage'), cfeate);

export default router;
