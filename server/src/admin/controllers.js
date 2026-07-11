import Author from '../author/model.js';
import User from '../user/model.js';
import { NotFoundError, ValidationError } from '../shared/utils/errors.js';
import { sendApplicationApproved, sendApplicationRejected } from '../shared/services/email.js';
import { getQdrantClient } from '../shared/config/qdrant.js';
import { usersConn, authorsConn, storiesConn } from '../shared/config/database.js';
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

export async function health(req, res, next) {
  try {
    const checks = {
      server: { status: 'ok', timestamp: new Date().toISOString() },
      database: { status: 'unknown' },
      qdrant: { status: 'unknown' },
    };
    try {
      const allReady = [usersConn, authorsConn, storiesConn].every(c => c.readyState === 1);
      checks.database = {
        status: allReady ? 'ok' : 'error',
        databases: {
          users: usersConn.readyState === 1 ? 'connected' : 'disconnected',
          authors: authorsConn.readyState === 1 ? 'connected' : 'disconnected',
          stories: storiesConn.readyState === 1 ? 'connected' : 'disconnected',
        },
      };
    } catch (e) { checks.database = { status: 'error', message: e.message }; }
    try {
      const qdrant = getQdrantClient();
      if (qdrant) {
        const cols = await qdrant.listCollections();
        checks.qdrant = { status: 'ok', collections: cols.collections?.length || 0 };
      }
    } catch (e) { checks.qdrant = { status: 'error', message: e.message }; }
    const ok = Object.values(checks).every(c => c.status === 'ok');
    res.status(ok ? 200 : 503).json({ status: ok ? 'healthy' : 'degraded', checks });
  } catch (e) { next(e); }
}
