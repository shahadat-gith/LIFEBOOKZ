import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';
import Card, { CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { Icons } from '../../icons';
import toast from 'react-hot-toast';

function getPreview(story, max = 80) {
  const title = story?.title?.trim();
  if (title) return title.length > max ? `${title.slice(0, max)}…` : title;

  // Fallback: strip plain text from an HTML string document (legacy drafts)
  const html = typeof story?.content === 'string' ? story.content : '';
  const plain = html.replace(/<[^>]*>/g, '').trim() || '';
  return plain.length > max ? `${plain.slice(0, max)}…` : plain || 'Untitled';
}

const statusBadge = {
  draft: { variant: 'warning', label: 'Draft' },
  published: { variant: 'success', label: 'Published' },
};

export default function StoriesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  async function runAction(storyId, action) {
    setBusyId(storyId);
    try {
      await action();
      await loadStories();
    } catch {
      toast.error('The action failed. Please try again.');
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  const handleFeature = (story) =>
    runAction(story._id, () => adminApi.setStoryFeatured(story._id, !story.featured));
  const handleUnpublish = (story) =>
    runAction(story._id, () => adminApi.unpublishStory(story._id));
  const handleDelete = (story) =>
    runAction(story._id, () => adminApi.deleteStory(story._id));

  const statuses = ['all', ...new Set(stories.map((s) => s.status))];
  const filteredStories = stories.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const title = s.title?.toLowerCase() || '';
    const authorName = s.author?.fullName?.toLowerCase() || '';
    return title.includes(q) || authorName.includes(q);
  });

  // Stats
  const published = stories.filter((s) => s.status === 'published').length;
  const featured = stories.filter((s) => s.featured).length;
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
      {/* Page heading */}
      <header className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Content</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Stories
        </h1>
        <p className="text-sm text-muted-foreground">
          Moderate published lifebooks — feature the best, take down what breaks the rules.
        </p>
      </header>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card padding="md">
          <p className="font-display text-2xl font-extrabold text-foreground">{stories.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total Stories</p>
        </Card>
        <Card padding="md">
          <p className="font-display text-2xl font-extrabold text-success">{published}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Published</p>
        </Card>
        <Card padding="md">
          <p className="font-display text-2xl font-extrabold text-accent">{featured}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Featured</p>
        </Card>
        <Card padding="md">
          <p className="font-display text-2xl font-extrabold text-info">{totalViews.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total Views · {totalLikes.toLocaleString()} likes</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Icons.search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories by title or author"
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && ` (${stories.filter((s) => s.status === status).length})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Stories list */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">All Stories</CardTitle>
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
              title={search || statusFilter !== 'all' ? 'No stories match your filters' : 'No stories found'}
              description="Try adjusting your search or filters."
            />
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-muted/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
              <div className="col-span-4">Story</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Stats</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            <div className="divide-y divide-border">
              {filteredStories.map((story, idx) => {
                const badge = statusBadge[story.status] || { variant: 'default', label: story.status };
                const busy = busyId === story._id;
                return (
                  <motion.div
                    key={story._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                    className="grid grid-cols-1 items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 md:grid-cols-12 md:gap-4 md:px-6"
                  >
                    <div className="col-span-4 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {getPreview(story)}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {story.featured && <Badge variant="accent">Featured</Badge>}
                        {story.visibility === 'public' && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                            <Icons.globe className="h-3 w-3" /> public
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="truncate text-sm text-muted-foreground">
                        {story.author?.fullName || 'Unknown'}
                      </p>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span title="Likes">
                          <Icons.star className="mr-0.5 inline h-3 w-3 text-warning" />
                          {story.stats?.likes || 0}
                        </span>
                        <span title="Views">
                          <Icons.eye className="mr-0.5 inline h-3 w-3" />
                          {story.stats?.views || 0}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleFeature(story)}
                          title={story.featured ? 'Remove from featured' : 'Feature this story'}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
                            story.featured
                              ? 'border-accent/30 bg-accent/10 text-accent'
                              : 'border-border bg-card text-muted-foreground hover:text-accent'
                          }`}
                        >
                          <Icons.star className="h-4 w-4" />
                        </button>
                        {story.status === 'published' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleUnpublish(story)}
                            title="Unpublish (back to draft)"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-warning disabled:opacity-50"
                          >
                            <Icons.eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmDelete(story)}
                          title="Delete permanently"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive disabled:opacity-50"
                        >
                          <Icons.trash className="h-4 w-4" />
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

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/45 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <Icons.trash className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Delete this story?</h3>
                <p className="text-xs text-muted-foreground">
                  Its likes and comments are removed too. This cannot be undone.
                </p>
              </div>
            </div>
            <p className="mb-5 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">
              {getPreview(confirmDelete, 100)}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={busyId === confirmDelete._id}
                onClick={() => handleDelete(confirmDelete)}
              >
                Delete permanently
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
