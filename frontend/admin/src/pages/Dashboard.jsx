import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../utils/client';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { Icons } from '../icons';

const quickLinks = [
  {
    title: 'Authors',
    description: 'Review and manage author applications',
    path: '/dashboard/authors',
    icon: Icons.faUserTie,
    color: 'from-accent to-yellow-700',
    countKey: 'pendingAuthors',
    label: 'Pending',
  },
  {
    title: 'Stories',
    description: 'View all published and pending stories',
    path: '/dashboard/stories',
    icon: Icons.faBookOpen,
    color: 'from-primary to-gray-400',
    countKey: 'totalStories',
    label: 'Total',
  },
  {
    title: 'Users',
    description: 'Manage registered platform users',
    path: '/dashboard/users',
    icon: Icons.faUsers,
    color: 'from-info to-blue-600',
    countKey: 'totalUsers',
    label: 'Total',
  },
];

const statsCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Icons.faUsers, color: 'text-accent', border: 'border-l-accent' },
  { key: 'totalAuthors', label: 'Total Authors', icon: Icons.faUserTie, color: 'text-primary', border: 'border-l-primary' },
  { key: 'totalStories', label: 'Published Stories', icon: Icons.faBookOpen, color: 'text-info', border: 'border-l-info' },
  { key: 'pendingAuthors', label: 'Pending Authors', icon: Icons.clock, color: 'text-warning', border: 'border-l-warning' },
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-yellow-700 flex items-center justify-center shadow-lg shadow-accent/20">
            <Icons.shieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening on LifeBookz.</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          const isWarning = card.key === 'pendingAuthors' && value > 0;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card padding="lg" className={`border-l-4 ${card.border} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                  <Icon className="w-full h-full" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className={`text-3xl font-bold ${isWarning ? 'text-warning' : 'text-foreground'}`}>
                  {value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {quickLinks.map((link, idx) => {
          const Icon = link.icon;
          const count = stats?.[link.countKey] ?? 0;
          return (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.08 }}
            >
              <Link to={link.path} className="block group">
                <Card hover padding="lg" className="relative overflow-hidden h-full">
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity" />
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-foreground">{count}</p>
                      <p className="text-xs text-muted-foreground">{link.label}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Authors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icons.clock className="h-4 w-4 text-warning" />
                <CardTitle>Pending Author Applications</CardTitle>
              </div>
              <Link
                to="/dashboard/authors"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                View all <Icons.chevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            {recentPending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Icons.userCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No pending applications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentPending.map((author) => (
                  <div key={author._id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-xs font-bold text-warning flex-shrink-0">
                      {author.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{author.fullName}</p>
                      <p className="text-xs text-muted-foreground">{author.email}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icons.faBookOpen className="h-4 w-4 text-accent" />
                <CardTitle>Recent Stories</CardTitle>
              </div>
              <Link
                to="/dashboard/stories"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                View all <Icons.chevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            {recentStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Icons.book className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No stories yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentStories.map((story) => {
                  const preview = story.content?.replace(/<[^>]*>/g, '').trim() || 'Untitled';
                  const truncated = preview.length > 60 ? preview.slice(0, 60) + '...' : preview;
                  return (
                    <div key={story._id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{truncated}</p>
                        <p className="text-xs text-muted-foreground">
                          by {story.author?.fullName || 'Unknown'} • {story.stats?.likes || 0} likes
                        </p>
                      </div>
                      <Badge variant={story.status === 'published' ? 'success' : story.status === 'draft' ? 'warning' : 'info'}>
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
