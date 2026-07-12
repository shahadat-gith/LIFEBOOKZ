import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { adminApi } from '../../../services/apis/admin';
import Button from '../../../components/ui/Button';
import Card, { CardTitle, CardContent } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Modal from '../../../components/ui/Modal';
import Textarea from '../../../components/ui/Textarea';
import LoadingScreen from '../../../components/utilities/LoadingScreen';
import EmptyState from '../../../components/utilities/EmptyState';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';

interface Application {
  _id: string;
  email: string;
  fullName: string;
  bio: string;
  website: string;
  createdAt: string;
}

interface DashboardData {
  totalUsers: number;
  totalAuthors: number;
  pendingApplications: number;
}

export default function AdminDashboardPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    if (!admin) return;
    Promise.all([adminApi.dashboard(), adminApi.listApplications()])
      .then(([dashboardRes, appsRes]) => {
        setDashboard(dashboardRes.data);
        setApplications(appsRes.data.applications);
      })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, [admin]);

  async function handleApprove(authorId: string) {
    if (!window.confirm('Approve this author application?')) return;
    setActionLoading(true);
    try {
      await adminApi.approveApplication(authorId);
      toast.success('Application approved! Author notified.');
      setApplications((prev) => prev.filter((a) => a._id !== authorId));
      setSelectedApp(null);
    } catch {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(authorId: string) {
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.rejectApplication(authorId, rejectReason);
      toast.success('Application rejected');
      setApplications((prev) => prev.filter((a) => a._id !== authorId));
      setRejectModalOpen(false);
      setSelectedApp(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  }

  if (!admin) {
    navigate('/login');
    return null;
  }

  if (loading) return <LoadingScreen message="Loading admin dashboard..." />;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">{admin.email}</p>
        </div>
        <Badge variant="danger">
          <Icons.shieldCheck className="h-3 w-3" />
          Admin
        </Badge>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card padding="md" className="text-center">
            <p className="text-3xl font-bold text-foreground">{dashboard.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </Card>
          <Card padding="md" className="text-center">
            <p className="text-3xl font-bold text-foreground">{dashboard.totalAuthors}</p>
            <p className="text-xs text-muted-foreground">Total Authors</p>
          </Card>
          <Card padding="md" className="text-center">
            <p className="text-3xl font-bold text-warning">{dashboard.pendingApplications}</p>
            <p className="text-xs text-muted-foreground">Pending Applications</p>
          </Card>
        </div>
      )}

      {/* Applications */}
      <Card>
        <CardContent className="p-6">
          <CardTitle className="mb-6 flex items-center gap-2">
            <Icons.userAdd className="h-5 w-5" />
            Pending Author Applications
          </CardTitle>

          {applications.length === 0 ? (
            <EmptyState
              icon={<Icons.userCheck className="h-12 w-12" />}
              title="All caught up!"
              description="No pending author applications to review."
            />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app._id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={app.fullName} size="md" />
                      <div>
                        <p className="font-medium text-foreground">{app.fullName}</p>
                        <p className="text-sm text-muted-foreground">{app.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(app._id);
                        }}
                        icon={<Icons.check className="h-4 w-4" />}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                          setRejectModalOpen(true);
                        }}
                        icon={<Icons.close className="h-4 w-4" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Modal */}
      <Modal
        isOpen={!!selectedApp && !rejectModalOpen}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
      >
        {selectedApp && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={selectedApp.fullName} size="lg" />
              <div>
                <p className="text-lg font-semibold text-foreground">{selectedApp.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedApp.email}</p>
              </div>
            </div>
            {selectedApp.bio && (
              <div>
                <p className="text-sm font-medium text-foreground">Bio</p>
                <p className="text-sm text-muted-foreground">{selectedApp.bio}</p>
              </div>
            )}
            {selectedApp.website && (
              <div>
                <p className="text-sm font-medium text-foreground">Website</p>
                <a
                  href={selectedApp.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {selectedApp.website}
                </a>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Applied {new Date(selectedApp.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="danger" onClick={() => { setRejectModalOpen(true); }}>
            Reject
          </Button>
          <Button
            variant="primary"
            loading={actionLoading}
            onClick={() => selectedApp && handleApprove(selectedApp._id)}
            icon={<Icons.check className="h-4 w-4" />}
          >
            Approve
          </Button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectReason(''); }}
        title="Reject Application"
      >
        <Textarea
          label="Rejection Reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Explain why the application is being rejected..."
          rows={4}
          required
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={actionLoading}
            onClick={() => selectedApp && handleReject(selectedApp._id)}
          >
            Confirm Rejection
          </Button>
        </div>
      </Modal>
    </div>
  );
}
