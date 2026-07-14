import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { storyApi } from '../../../services/apis/stories';
import { searchApi } from '../../../services/apis/search';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Card, { CardTitle, CardContent } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/utilities/EmptyState';
import LoadingScreen from '../../../components/utilities/LoadingScreen';
import { Icons } from '../../../icons';

interface StorySummary {
  _id: string;
  id: string;
  title: string;
  publishedAt?: string;
  createdAt: string;
  tags: string[];
  language: string;
}

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const storyVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.05, ease: 'easeOut' },
  }),
};

export function AuthorDashboardPage() {
  const { author } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [trending, setTrending] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!author) return;
    Promise.all([
      storyApi.list({ authorId: author._id, limit: 50 }),
      searchApi.trending(10),
    ])
      .then(([storiesRes, trendingRes]) => {
        setStories(storiesRes.data.stories || []);
        setTrending(trendingRes.data.results?.length || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [author]);

  if (!author) {
    navigate('/author/login');
    return null;
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  const publishedCount = stories.filter((s) => s.publishedAt).length;
  const draftCount = stories.length - publishedCount;

  const statCards = [
    { label: 'Total Stories', value: stories.length, color: 'from-primary to-accent', icon: <Icons.book className="h-5 w-5 text-white" />, textColor: 'text-foreground' },
    { label: 'Published', value: publishedCount, color: 'from-emerald-500 to-teal-600', icon: <Icons.checkCircle className="h-5 w-5 text-white" />, textColor: 'text-emerald-500' },
    { label: 'Drafts', value: draftCount, color: 'from-amber-500 to-orange-600', icon: <Icons.edit className="h-5 w-5 text-white" />, textColor: 'text-amber-500' },
    { label: 'Trending', value: trending, color: 'from-violet-500 to-purple-600', icon: <Icons.sparkles className="h-5 w-5 text-white" />, textColor: 'text-violet-500' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto py-10 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Avatar src={author.avatar} name={author.fullName} size="lg" className="ring-4 ring-border shadow-lg" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">{author.fullName}</h1>
              <Badge
                variant={
                  author.verification.status === 'approved'
                    ? 'success'
                    : author.verification.status === 'rejected'
                    ? 'danger'
                    : 'warning'
                }
                className="mt-1"
              >
                {author.verification.status === 'approved' ? (
                  <><Icons.verified className="h-3 w-3" /> Verified</>
                ) : author.verification.status === 'rejected' ? (
                  'Rejected'
                ) : (
                  <><Icons.pending className="h-3 w-3" /> Pending Approval</>
                )}
              </Badge>
            </div>
          </div>
          <Link to="/stories/new">
            <Button
              icon={<Icons.plus className="h-4 w-4" />}
              className="bg-gradient-to-r from-primary to-accent hover:brightness-110 shadow-lg shadow-primary/25"
            >
              New Story
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} custom={i} variants={statVariants}>
              <Card padding="lg" className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Icon circle */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-md`}>
                  {stat.icon}
                </div>
                
                <p className={`text-3xl font-bold font-display ${stat.textColor} mb-1`}>
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* My Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary opacity-50" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <CardTitle className="flex items-center gap-2">
                  <Icons.book className="h-5 w-5 text-primary" />
                  My Stories
                </CardTitle>
                <Link
                  to="/stories"
                  className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  View all &rarr;
                </Link>
              </div>

              {stories.length === 0 ? (
                <EmptyState
                  icon={<Icons.book className="h-12 w-12" />}
                  title="No stories yet"
                  description="Start writing your first story and share it with the world."
                  action={{ label: 'Write Your First Story', onClick: () => navigate('/stories/new') }}
                />
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {stories.map((story, i) => (
                    <motion.div
                      key={story._id}
                      custom={i}
                      variants={storyVariants}
                      className="group flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/stories/${story._id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {story.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {story.publishedAt ? (
                            <Badge variant="success" className="text-[10px]">
                              Published {new Date(story.publishedAt).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Draft
                            </Badge>
                          )}
                          <Badge variant="default" className="text-[10px]">
                            {story.language.toUpperCase()}
                          </Badge>
                          {story.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="primary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Link
                        to={`/stories/${story._id}/edit`}
                        className="ml-4 p-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icons.edit className="h-4 w-4" />
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Link to="/author/profile" className="block mt-6">
            <Card hover padding="md" className="group hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icons.settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Author Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Edit your bio, links, and avatar
                    </p>
                  </div>
                </div>
                <Icons.chevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default AuthorDashboardPage;
