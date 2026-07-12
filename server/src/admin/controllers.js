import Author from '../author/model.js';
import User from '../user/model.js';
import { NotFoundError, ValidationError } from '../shared/utils/errors.js';
import { sendApplicationApproved, sendApplicationRejected } from '../shared/services/email.js';
import { getQdrantClient } from '../shared/config/qdrant.js';

import log from '../shared/utils/logger.js';

export async function dashboard(req, res, next) {
  try {
    const [totalUsers, totalAuthors, pendingApplications] = await Promise.all([
      User.countDocuments({}), Author.countDocuments({}),
      Author.countDocuments({ 'verification.status': 'pending' }),
    ]);
    res.json({ totalUsers, totalAuthors, pendingApplications });
  } catch (e) { next(e); }
}

export async function listApplications(req, res, next) {
  try {
    const applications = await Author.find({ 'verification.status': 'pending' })
      .select('email fullName bio website createdAt').sort({ createdAt: 1 });
    res.json({ applications });
  } catch (e) { next(e); }
}

export async function approveApplication(req, res, next) {
  try {
    const author = await Author.findById(req.params.authorId);
    if (!author) throw new NotFoundError('Author not found');
    author.verification.status = 'approved';
    author.verification.verifiedAt = new Date();
    if (req.body.note) author.verification.rejectionReason = req.body.note;
    await author.save();
    sendApplicationApproved(author.email, author.fullName).catch(err =>
      log('error', 'Failed to send approval email', { error: err.message, authorId: req.params.authorId })
    );
    res.json({ author, message: 'Application approved. Author has been notified via email.' });
  } catch (e) { next(e); }
}

export async function rejectApplication(req, res, next) {
  try {
    if (!req.body.reason) throw new ValidationError('Rejection reason is required');
    const author = await Author.findById(req.params.authorId);
    if (!author) throw new NotFoundError('Author not found');
    author.verification.status = 'rejected';
    author.verification.verifiedAt = new Date();
    author.verification.rejectionReason = req.body.reason;
    await author.save();
    sendApplicationRejected(author.email, author.fullName, req.body.reason).catch(err =>
      log('error', 'Failed to send rejection email', { error: err.message, authorId: req.params.authorId })
    );
    res.json({ author, message: 'Application rejected. Author has been notified via email.' });
  } catch (e) { next(e); }
}

