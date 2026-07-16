import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/stories';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Card, { CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';
import { Icons } from '../icons';

interface Story { _id: string; title: string; publishedAt?: string; createdAt: string; tags: string[]; language: string; }

export default function AuthorDashboardPage() {
  const { author } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!author) return;
    storyApi.list({ authorId: author._id, limit: 50 })
      .then(r => setStories(r.data.stories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [author]);

  if (!author) { navigate('/login'); return null; }
  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  const published = stories.filter(s => s.publishedAt).length;
  const drafts = stories.length - published;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
          <Avatar src={author.avatar} name={author.fullName} size="lg" className="ring-4 ring-border shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{author.fullName}</h1>
            <Badge variant={author.verification.status === 'approved' ? 'success' : author.verification.status === 'rejected' ? 'danger' : 'warning'}>
              {author.verification.status === 'approved' ? 'Verified' : author.verification.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
            </Badge>
          </div>
        </div>
        <Link to="/stories/new"><Button icon={<Icons.plus className="h-4 w-4" />} className="bg-gradient-to-r from-primary to-accent hover:brightness-110 shadow-lg shadow-primary/25">New Story</Button></Link>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <Card padding="lg"><p className="text-3xl font-bold text-primary mb-1">{stories.length}</p><p className="text-xs text-muted-foreground">Total Stories</p></Card>
        <Card padding="lg"><p className="text-3xl font-bold text-success mb-1">{published}</p><p className="text-xs text-muted-foreground">Published</p></Card>
        <Card padding="lg"><p className="text-3xl font-bold text-warning mb-1">{drafts}</p><p className="text-xs text-muted-foreground">Drafts</p></Card>
      </div>

      <Card><CardContent className="p-6">
        <div className="flex items-center justify-between mb-6"><CardTitle>My Stories</CardTitle></div>
        {stories.length === 0 ? (
          <EmptyState icon={<Icons.book className="h-12 w-12" />} title="No stories yet" description="Start writing your first story!" action={{ label: 'Write Your First Story', onClick: () => navigate('/stories/new') }} />
        ) : (
          <div className="space-y-2">
            {stories.map(s => (
              <div key={s._id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => navigate(`/stories/${s._id}`)}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={s.publishedAt ? 'success' : 'warning'} className="text-[10px]">{s.publishedAt ? 'Published' : 'Draft'}</Badge>
                    <Badge variant="default" className="text-[10px]">{s.language.toUpperCase()}</Badge>
                  </div>
                </div>
                <Link to={`/stories/${s._id}/edit`} onClick={e => e.stopPropagation()} className="ml-4 p-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"><Icons.edit className="h-4 w-4" /></Link>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
