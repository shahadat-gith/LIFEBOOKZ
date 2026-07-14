import { Router } from 'express';
import upload from '../shared/middlewares/multer.js';
import * as uploadService from '../shared/services/upload.js';
import { authenticate } from '../auth/middleware.js';
import User from '../user/model.js';

const router = Router();

router.post('/image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    res.status(201).json(await uploadService.uploadImage(req.file.buffer));
  } catch (e) { next(e); }
});

router.post('/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const result = await uploadService.uploadAvatar(req.file.buffer);
    await User.findByIdAndUpdate(req.user._id, { avatar: result.url });
    res.status(201).json(result);
  } catch (e) { next(e); }
});

router.post('/document', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const result = await uploadService.uploadDocument(req.file.buffer);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

export default router;
