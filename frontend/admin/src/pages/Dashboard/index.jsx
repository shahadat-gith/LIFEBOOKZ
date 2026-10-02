import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Icons } from '../../icons';

const statTiles = [
  { key: 'totalUsers', label: 'Total Users', icon: Icons.faUsers, href: '/dashboard/users', tone: 'text-info' },
  { key: 'totalAuthors', label: 'Authors', icon: Icons.faUserTie, href: '/dashboard/authors', tone: 'text-primary' },
  { key: 'totalExperts', label: 'Experts', icon: Icons.faUserGraduate, href: '/dashboard/experts', tone: 'text-secondary' },
  { key: 'totalStories', label: 'Published Stories', icon: Icons.faBookOpen, href: '/dashboard/stories', tone: 'text-accent' },
];

export default function AdminDashboardPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentPending, setRecentPending] = useState([]);
  const [recentStories, setRecentStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getPendingAuthors(),
      adminApi.getStories(),
    ])
      .then(([s, a, st]) => {
        setStats(s.data.data);
        setRecentPending((a.data.data || []).slice(0, 5));
        setRecentStories((st.data.data || []).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  const needsAttention = (stats?.pendingAuthors || 0) + (stats?.pendingExperts || 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page heading — navy display title with coral eyebrow, like the client portal */}
      <header className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Overview
        </p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across LifeBookz right now.
        </p>
      </header>

      {/* Attention banner */}
      {needsAttention > 0 && (
        <Link
          to="/dashboard/authors"
          className="mb-6 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning transition-colors hover:bg-warning/15"
        >
          <Icons.clock className="h-5 w-5 shrink-0" />
          <span className="flex-1 font-medium">
            {needsAttention} application{needsAttention > 1 ? 's' : ''} waiting for review.
          </span>
          <Icons.chevronRight className="h-4 w-4" />
        </Link>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        {statTiles.map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <motion.div
              key={tile.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <Link to={tile.href} className="group block">
                <Card padding="lg" className="transition-all group-hover:border-primary/25 group-hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/8 group-hover:text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <Icons.chevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-4 font-display text-3xl font-extrabold text-foreground">
                    {(stats?.[tile.key] ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {tile.label}
                  </p>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Activity columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending applications */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Pending Applications</CardTitle>
              <Link
                to="/dashboard/authors"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                Review <Icons.chevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            {recentPending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Icons.userCheck className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No pending applications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentPending.map((author) => (
                  <div key={author._id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-warning/10 text-xs font-bold text-warning">
                      {author.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{author.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {author.email}{author.profession ? ` · ${author.profession}` : ''}
                      </p>
                    </div>
                    <Badge variant="warning">Author</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent stories */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Latest Stories</CardTitle>
              <Link
                to="/dashboard/stories"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                Manage <Icons.chevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            {recentStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Icons.book className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No stories yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentStories.map((story) => {
                  const title = story.title?.trim() || 'Untitled';
                  const truncated = title.length > 60 ? `${title.slice(0, 60)}…` : title;
                  return (
                    <div key={story._id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{truncated}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          by {story.author?.fullName || 'Unknown'} · {story.stats?.likes || 0} likes
                        </p>
                      </div>
                      {story.featured && <Badge variant="accent">Featured</Badge>}
                      <Badge variant={story.status === 'published' ? 'success' : 'warning'}>
                        {story.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
