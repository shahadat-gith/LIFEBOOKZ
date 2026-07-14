import User from './model.js';
import { sanitizeUser } from '../auth/utils.js';
import { NotFoundError, ValidationError } from '../shared/utils/errors.js';
import * as uploadService from '../shared/services/upload.js';

// ---- Profile ----

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new NotFoundError('User not found');
    res.json(sanitizeUser(user));
  } catch (error) { next(error); }
}

export async function updateMe(req, res, next) {
  try {
    const allowed = ['name', 'avatar', 'preferences'];
    const data = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    // Handle avatar file upload
    if (req.file) {
      const result = await uploadService.uploadAvatar(req.file.buffer);
      data.avatar = result.url;
    }

    const bad = Object.keys(req.body).filter(k => !allowed.includes(k));
    if (bad.length) throw new ValidationError(`Cannot update: ${bad.join(', ')}`);
    const user = await User.findByIdAndUpdate(req.user._id, { $set: data }, { new: true, runValidators: true });
    if (!user) throw new NotFoundError('User not found');
    res.json(sanitizeUser(user));
  } catch (error) { next(error); }
}

export async function deleteMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new NotFoundError('User not found');
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (error) { next(error); }
}

export async function updateMyPreferences(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new NotFoundError('User not found');
    const prefs = req.body;
    if (prefs.interests) user.preferences.interests = prefs.interests;
    if (prefs.profession) user.preferences.profession = prefs.profession;
    if (prefs.languages) user.preferences.languages = prefs.languages;
    if (prefs.location) user.preferences.location = { ...user.preferences.location, ...prefs.location };
    await user.save();
    res.json(user.preferences);
  } catch (error) { next(error); }
}

export async function getMyStats(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('createdAt');
    if (!user) throw new NotFoundError('User not found');
    res.json({ memberSince: user.createdAt });
  } catch (error) { next(error); }
}

export async function getUserProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) throw new NotFoundError('User not found');
    res.json(sanitizeUser(user));
  } catch (error) { next(error); }
}
