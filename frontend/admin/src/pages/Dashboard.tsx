import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/admin';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingScreen from '../components/common/LoadingScreen';
import EmptyState from '../components/common/EmptyState';
import { Icons } from '../icons';
import toast from 'react-hot-toast';
import type { DashboardStats, Author, User, Story } from '../types';

export default function AdminDashboardPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalAuthors: 0, totalStories: 0, pendingAuthors: 0 });
  const [pendingAuthors, setPendingAuthors] = useState<Author[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'authors' | 'stories' | 'users'>('authors');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getPendingAuthors(),
      adminApi.getStories(),
      adminApi.getUsers(),
    ]).then(([s, a, st, u]) => {
      setStats(s.data.data);
      setPendingAuthors(a.data.data || []);
      setStories(st.data.data || []);
      setUsers(u.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  async function handleApprove(authorId: string) {
    setActionLoading(authorId);
    try {
      await adminApi.approveAuthor(authorId);
      toast.success('Author approved!');
      setPendingAuthors(prev => prev.filter(a => a._id !== authorId));
    } catch {
      toast.error('Failed to approve');
    } finally { setActionLoading(null); }
  }

  async function handleReject(authorId: string) {
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    setActionLoading(authorId);
    try {
      await adminApi.rejectAuthor(authorId, reason.trim());
      toast.success('Author rejected');
      setPendingAuthors(prev => prev.filter(a => a._id !== authorId));
    } catch {
      toast.error('Failed to reject');
    } finally { setActionLoading(null); }
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card padding="lg"><p className="text-3xl font-bold text-primary mb-1">{stats.totalUsers}</p><p className="text-sm text-muted-foreground">Total Users</p></Card>
        <Card padding="lg"><p className="text-3xl font-bold text-accent mb-1">{stats.totalAuthors}</p><p className="text-sm text-muted-foreground">Total Authors</p></Card>
        <Card padding="lg"><p className="text-3xl font-bold text-info mb-1">{stats.totalStories}</p><p className="text-sm text-muted-foreground">Published Stories</p></Card>
        <Card padding="lg"><p className="text-3xl font-bold text-warning mb-1">{stats.pendingAuthors}</p><p className="text-sm text-muted-foreground">Pending Authors</p></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('authors')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'authors' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Authors ({pendingAuthors.length})</button>
        <button onClick={() => setActiveTab('stories')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stories' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Stories ({stories.length})</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'users' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Users ({users.length})</button>
      </div>

      {/* Authors Tab */}
      {activeTab === 'authors' && (
        <Card>
          <div className="p-6 border-b border-border"><h2 className="text-lg font-semibold">Pending Author Applications</h2></div>
          {pendingAuthors.length === 0 ? (
            <div className="p-6"><EmptyState icon={<Icons.userCheck className="h-12 w-12" />} title="No pending applications" description="All caught up!" /></div>
          ) : (
            <div className="divide-y divide-border">
              {pendingAuthors.map(a => (
                <div key={a._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{a.fullName}</p>
                    <p className="text-sm text-muted-foreground">{a.email} {a.profession && `• ${a.profession}`}</p>
                    <p className="text-xs text-muted-foreground mt-1">Applied {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <Button size="sm" loading={actionLoading === a._id} onClick={() => handleApprove(a._id)} icon={<Icons.check className="h-4 w-4" />}>Approve</Button>
                    <Button size="sm" variant="outline" loading={actionLoading === a._id} onClick={() => handleReject(a._id)} icon={<Icons.close className="h-4 w-4" />}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <Card>
          <div className="p-6 border-b border-border"><h2 className="text-lg font-semibold">All Stories</h2></div>
          {stories.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No stories found.</div>
          ) : (
            <div className="divide-y divide-border">
              {stories.map(s => (
                <div key={s._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-sm text-muted-foreground">by {s.author?.fullName || 'Unknown'}</p>
                  </div>
                  <Badge variant={s.status === 'published' ? 'success' : s.status === 'draft' ? 'warning' : 'info'}>{s.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <div className="p-6 border-b border-border"><h2 className="text-lg font-semibold">All Users</h2></div>
          {users.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No users found.</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map(u => (
                <div key={u._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{u.fullName}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
