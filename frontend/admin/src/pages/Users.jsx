import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../utils/client';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const filteredUsers = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="Loading users..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Icons.faUsers className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground">Manage registered users</p>
          </div>
        </div>
        <Badge variant="primary" className="text-sm px-3 py-1">
          {users.length} total
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card padding="md" className="border-l-4 border-l-accent">
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Users</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-info">
          <p className="text-2xl font-bold text-info">{filteredUsers.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Filtered</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <p className="text-2xl font-bold text-primary">
            {users.filter(u => u.createdAt && new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">This Week</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Icons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full max-w-md rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
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
              title={search ? "No users match your search" : "No users found"}
              description={search ? "Try a different search term" : "No users have registered yet."}
            />
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-5">User</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2 text-center">Joined</div>
              <div className="col-span-2 text-center">Status</div>
            </div>
            <div className="divide-y divide-border">
              {filteredUsers.map((user, idx) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.015 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-yellow-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{user.fullName || 'Unnamed'}</p>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })
                        : '—'}
                    </p>
                  </div>
                  <div className="col-span-2 text-center">
                    <Badge variant="success">Active</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
