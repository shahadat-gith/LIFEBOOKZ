import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../utils/client';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

export default function AuthorsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pendingAuthors, setPendingAuthors] = useState([]);
  const [approvedAuthors, setApprovedAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeSection, setActiveSection] = useState('pending');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadData();
  }, [isAuthenticated, navigate]);

  async function loadData() {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        adminApi.getPendingAuthors(),
        adminApi.getApprovedAuthors(),
      ]);
      setPendingAuthors(pendingRes.data.data || []);
      setApprovedAuthors(approvedRes.data.data || []);
    } catch {
      toast.error('Failed to load authors data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(authorId) {
    setActionLoading(authorId);
    try {
      await adminApi.approveAuthor(authorId);
      toast.success('Author approved successfully!');
      setPendingAuthors(prev => prev.filter(a => a._id !== authorId));
      // Refresh approved list
      const res = await adminApi.getApprovedAuthors();
      setApprovedAuthors(res.data.data || []);
    } catch {
      toast.error('Failed to approve author');
    } finally { setActionLoading(null); }
  }

  async function handleReject(authorId) {
    if (!rejectReason?.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(authorId);
    try {
      await adminApi.rejectAuthor(authorId, rejectReason.trim());
      toast.success('Author rejected');
      setPendingAuthors(prev => prev.filter(a => a._id !== authorId));
      setRejectModal(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject author');
    } finally { setActionLoading(null); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="Loading authors..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Icons.faUserTie className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Authors</h1>
            <p className="text-sm text-muted-foreground">Manage author applications and approved authors</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card padding="md" className="border-l-4 border-l-warning">
          <p className="text-2xl font-bold text-warning">{pendingAuthors.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pending Review</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-success">
          <p className="text-2xl font-bold text-success">{approvedAuthors.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Approved</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-info">
          <p className="text-2xl font-bold text-info">
            {approvedAuthors.reduce((sum, a) => sum + (a.storyCount || 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Stories</p>
        </Card>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeSection === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('pending')}
          icon={<Icons.clock className="h-4 w-4" />}
        >
          Pending ({pendingAuthors.length})
        </Button>
        <Button
          variant={activeSection === 'approved' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('approved')}
          icon={<Icons.checkCircle className="h-4 w-4" />}
        >
          Approved ({approvedAuthors.length})
        </Button>
      </div>

      {/* Pending Authors Section */}
      <AnimatePresence mode="wait">
        {activeSection === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription>Authors waiting for approval</CardDescription>
              </CardHeader>
              {pendingAuthors.length === 0 ? (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={<Icons.userCheck className="h-12 w-12" />}
                    title="No pending applications"
                    description="All caught up! No authors awaiting approval."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingAuthors.map((author, idx) => (
                    <motion.div
                      key={author._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
                              {author.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{author.fullName}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{author.email}</span>
                                {author.profession && (
                                  <>
                                    <span>•</span>
                                    <span>{author.profession}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge variant="warning" className="ml-auto">Pending</Badge>
                          </div>
                          {author.bio && (
                            <p className="text-sm text-muted-foreground/70 mt-2 line-clamp-2 ml-11">
                              {author.bio}
                            </p>
                          )}
                          {author.socialLinks?.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 ml-11">
                              {author.socialLinks.slice(0, 3).map((link, i) => (
                                <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                  {link.platform || link.type}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 ml-11">
                            <Icons.calendar className="h-3 w-3 inline mr-1" />
                            Applied {new Date(author.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            loading={actionLoading === author._id}
                            onClick={() => handleApprove(author._id)}
                            icon={<Icons.check className="h-4 w-4" />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectModal(author._id)}
                            icon={<Icons.close className="h-4 w-4" />}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Approved Authors Section */}
        {activeSection === 'approved' && (
          <motion.div
            key="approved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Approved Authors</CardTitle>
                <CardDescription>{approvedAuthors.length} verified authors</CardDescription>
              </CardHeader>
              {approvedAuthors.length === 0 ? (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={<Icons.userCheck className="h-12 w-12" />}
                    title="No approved authors"
                    description="Approve some authors to see them here."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {approvedAuthors.map((author, idx) => (
                    <motion.div
                      key={author._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-sm font-bold text-success flex-shrink-0">
                          {author.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{author.fullName}</p>
                            <Badge variant="success">Approved</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {author.email}
                            {author.profession && <> • {author.profession}</>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{author.storyCount || 0}</p>
                          <p className="text-xs text-muted-foreground">stories</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setRejectModal(null); setRejectReason(''); }} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Icons.ban className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Reject Application</h3>
                  <p className="text-sm text-muted-foreground">Provide a reason for rejection</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all min-h-[120px] resize-y mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  loading={actionLoading === rejectModal}
                  onClick={() => handleReject(rejectModal)}
                  disabled={!rejectReason.trim()}
                >
                  Confirm Reject
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
