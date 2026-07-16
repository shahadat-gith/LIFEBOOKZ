import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingScreen from '../components/common/LoadingScreen';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const { admin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalAuthors: 0, pendingApplications: 0 });
  const [apps, setApps] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !admin) { navigate('/login'); return; }
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/applications'),
    ]).then(([s, a]) => {
      setStats(s.data);
      setApps(a.data.applications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated, admin, navigate]);

  async function handleApprove(authorId: string) {
    try { await api.post('/admin/applications/' + authorId + '/approve'); toast.success('Approved!'); window.location.reload(); }
    catch { toast.error('Failed'); }
  }

  async function handleReject(authorId: string) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try { await api.post('/admin/applications/' + authorId + '/reject', { reason }); toast.success('Rejected'); window.location.reload(); }
    catch { toast.error('Failed'); }
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <Card padding="lg"><p className="text-3xl font-bold text-primary mb-1">{stats.totalUsers}</p><p className="text-sm text-muted-foreground">Total Users</p></Card>
        <Card padding="lg"><p className="text-3xl font-bold text-accent mb-1">{stats.totalAuthors}</p><p className="text-sm text-muted-foreground">Total Authors</p></Card>
        <Card padding="lg"><p className="text-3xl font-bold text-warning mb-1">{stats.pendingApplications}</p><p className="text-sm text-muted-foreground">Pending Applications</p></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border"><h2 className="text-lg font-semibold">Author Applications</h2></div>
        {apps.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No pending applications.</div>
        ) : (
          <div className="divide-y divide-border">
            {apps.map((a: Record<string, unknown>) => (
              <div key={a._id as string} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{a.fullName as string}</p>
                  <p className="text-sm text-muted-foreground">{a.email as string}</p>
                  <p className="text-xs text-muted-foreground mt-1">Applied {new Date(a.createdAt as string).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(a._id as string)} className="px-4 py-1.5 bg-success text-white text-sm rounded-lg hover:brightness-110 transition-all">Approve</button>
                  <button onClick={() => handleReject(a._id as string)} className="px-4 py-1.5 bg-destructive text-white text-sm rounded-lg hover:brightness-110 transition-all">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
