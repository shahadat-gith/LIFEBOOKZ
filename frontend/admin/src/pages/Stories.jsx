import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../utils/client';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

function getPreview(html, max = 80) {
  const plain = html?.replace(/<[^>]*>/g, '').trim() || '';
  return plain.length > max ? plain.slice(0, max) + '...' : plain || 'Untitled';
}

const statusBadge = {
  published: { variant: 'success', label: 'Published' },
  draft: { variant: 'warning', label: 'Draft' },
  pending: { variant: 'info', label: 'Pending' },
  rejected: { variant: 'danger', label: 'Rejected' },
};

export default function StoriesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadStories();
  }, [isAuthenticated, navigate]);

  async function loadStories() {
    setLoading(true);
    try {
      const res = await adminApi.getStories();
      setStories(res.data.data || []);
    } catch {
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  }

  const statuses = ['all', ...new Set(stories.map(s => s.status))];
  const filteredStories = stories.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const content = s.content?.replace(/<[^>]*>/g, '').toLowerCase() || '';
    const authorName = s.author?.fullName?.toLowerCase() || '';
    return content.includes(q) || authorName.includes(q);
  });

  // Stats
  const published = stories.filter(s => s.status === 'published').length;
  const drafts = stories.filter(s => s.status === 'draft').length;
  const totalViews = stories.reduce((sum, s) => sum + (s.stats?.views || 0), 0);
  const totalLikes = stories.reduce((sum, s) => sum + (s.stats?.likes || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="Loading stories..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Icons.faBookOpen className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Stories</h1>
            <p className="text-sm text-muted-foreground">All published and pending stories</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card padding="md" className="border-l-4 border-l-accent">
          <p className="text-2xl font-bold text-foreground">{stories.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Stories</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-success">
          <p className="text-2xl font-bold text-success">{published}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Published</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-info">
          <p className="text-2xl font-bold text-info">{totalViews.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Views</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-warning">
          <p className="text-2xl font-bold text-warning">{totalLikes.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Likes</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Icons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories or authors..."
            className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && ` (${stories.filter(s => s.status === status).length})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Stories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Stories</CardTitle>
          <CardDescription>
            {filteredStories.length === stories.length
              ? `Showing all ${stories.length} stories`
              : `Showing ${filteredStories.length} of ${stories.length} stories`}
          </CardDescription>
        </CardHeader>
        {filteredStories.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={<Icons.book className="h-12 w-12" />}
              title={search || statusFilter !== 'all' ? "No stories match your filters" : "No stories found"}
              description="Try adjusting your search or filters."
            />
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Story</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Stats</div>
              <div className="col-span-2 text-center">Date</div>
            </div>
            <div className="divide-y divide-border">
              {filteredStories.map((story, idx) => {
                const badge = statusBadge[story.status] || { variant: 'default', label: story.status };
                return (
                  <motion.div
                    key={story._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.015 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                  >
                    <div className="col-span-4 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {getPreview(story.content)}
                      </p>
                      {story.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {story.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {story.author?.fullName || 'Unknown'}
                      </p>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span title="Likes">
                          <Icons.star className="h-3 w-3 inline mr-0.5 text-warning" />
                          {story.stats?.likes || 0}
                        </span>
                        <span title="Views">
                          <Icons.eye className="h-3 w-3 inline mr-0.5" />
                          {story.stats?.views || 0}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        {story.publishedAt || story.createdAt
                          ? new Date(story.publishedAt || story.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric'
                            })
                          : '—'}
                      </p>
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
