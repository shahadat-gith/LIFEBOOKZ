import { Router } from 'express';
import multer from 'multer';
import { uploadImage, uploadVideo, uploadAudio, uploadAvatar } from '../shared/services/r2.js';
import { authenticate } from '../auth/middleware.js';
import User from '../user/model.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported type: ${file.mimetype}`));
  },
});

router.post('/image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    res.status(201).json(await uploadImage(req.file.buffer, req.file.originalname));
  } catch (e) { next(e); }
});

router.post('/video', authenticate, upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    res.status(201).json(await uploadVideo(req.file.buffer, req.file.originalname));
  } catch (e) { next(e); }
});

router.post('/audio', authenticate, upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    res.status(201).json(await uploadAudio(req.file.buffer, req.file.originalname));
  } catch (e) { next(e); }
});

router.post('/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const result = await uploadAvatar(req.file.buffer, req.file.originalname);
    await User.findByIdAndUpdate(req.user._id, { avatar: result.url });
    res.status(201).json(result);
  } catch (e) { next(e); }
});



export default router;
