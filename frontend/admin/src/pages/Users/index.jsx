import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';
import Card, { CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { Icons } from '../../icons';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadUsers();
  }, [isAuthenticated, navigate]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(user, status) {
    setBusyId(user._id);
    try {
      await adminApi.setUserStatus(user._id, status);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status } : u)),
      );
      toast.success(status === 'suspended' ? 'User suspended.' : 'User reinstated.');
    } catch {
      toast.error('Could not update the user.');
    } finally {
      setBusyId(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const active = users.filter((u) => (u.status || 'active') === 'active').length;
  const suspended = users.length - active;
  const thisWeek = users.filter(
    (u) => u.createdAt && new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="Loading users..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page heading */}
      <header className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Community</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Users
        </h1>
        <p className="text-sm text-muted-foreground">
          Every reader account, with suspension controls for moderation.
        </p>
      </header>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card padding="md">
          <p className="font-display text-2xl font-extrabold text-foreground">{users.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total Users</p>
        </Card>
        <Card padding="md">
          <p className="font-display text-2xl font-extrabold text-success">{active}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Active</p>
        </Card>
        <Card padding="md">
          <p className={`font-display text-2xl font-extrabold ${suspended > 0 ? 'text-destructive' : 'text-foreground'}`}>
            {suspended}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Suspended</p>
        </Card>
        <Card padding="md">
          <p className="font-display text-2xl font-extrabold text-info">{thisWeek}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Joined this week</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Icons.search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email"
          className="w-full max-w-md rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Users list */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length === users.length
              ? `Showing all ${users.length} users`
              : `Showing ${filteredUsers.length} of ${users.length} users`}
          </CardDescription>
        </CardHeader>
        {filteredUsers.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={<Icons.users className="h-12 w-12" />}
              title={search ? 'No users match your search' : 'No users found'}
              description={search ? 'Try a different search term' : 'No users have registered yet.'}
            />
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-muted/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
              <div className="col-span-5">User</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2 text-center">Joined</div>
              <div className="col-span-2 text-center">Status</div>
            </div>
            <div className="divide-y divide-border">
              {filteredUsers.map((user, idx) => {
                const isActive = (user.status || 'active') === 'active';
                const busy = busyId === user._id;
                return (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                    className="grid grid-cols-1 items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 md:grid-cols-12 md:gap-4 md:px-6"
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.fullName || 'Unnamed'}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant={isActive ? 'success' : 'danger'}>
                          {isActive ? 'Active' : 'Suspended'}
                        </Badge>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleStatus(user, isActive ? 'suspended' : 'active')}
                          title={isActive ? 'Suspend this account' : 'Reinstate this account'}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors disabled:opacity-50 ${
                            isActive ? 'hover:border-destructive/30 hover:text-destructive' : 'hover:text-success'
                          }`}
                        >
                          {isActive ? <Icons.ban className="h-4 w-4" /> : <Icons.check className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
