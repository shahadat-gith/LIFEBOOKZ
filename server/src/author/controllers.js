import Author from './model.js';
import { NotFoundError, ValidationError } from '../shared/utils/errors.js';

export async function getMe(req, res, next) {
  try {
    const author = await Author.findById(req.author._id);
    if (!author) throw new NotFoundError('Author not found');
    res.json(author);
  } catch (e) { next(e); }
}

export async function updateMe(req, res, next) {
  try {
    const allowed = ['fullName', 'bio', 'website', 'avatar', 'socialLinks'];
    const data = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    const bad = Object.keys(req.body).filter(k => !allowed.includes(k));
    if (bad.length) throw new ValidationError(`Cannot update: ${bad.join(', ')}`);
    const author = await Author.findByIdAndUpdate(req.author._id, { $set: data }, { new: true, runValidators: true });
    if (!author) throw new NotFoundError('Author not found');
    res.json(author);
  } catch (e) { next(e); }
}

export async function getProfile(req, res, next) {
  try {
    const author = await Author.findById(req.params.authorId);
    if (!author) throw new NotFoundError('Author not found');
    res.json(author);
  } catch (e) { next(e); }
}
