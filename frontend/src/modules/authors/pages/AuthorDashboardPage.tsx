import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
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

export default function AuthorDashboardPage() {
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

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar src={author.avatar} name={author.fullName} size="lg" className="ring-4 ring-border" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{author.fullName}</h1>
            <Badge
              variant={
                author.verification.status === 'approved'
                  ? 'success'
                  : author.verification.status === 'rejected'
                  ? 'danger'
                  : 'warning'
              }
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
          <Button icon={<Icons.plus className="h-4 w-4" />}>New Story</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-foreground">{stories.length}</p>
          <p className="text-xs text-muted-foreground">Total Stories</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-success">{publishedCount}</p>
          <p className="text-xs text-muted-foreground">Published</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-warning">{draftCount}</p>
          <p className="text-xs text-muted-foreground">Drafts</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-primary">{trending}</p>
          <p className="text-xs text-muted-foreground">Trending</p>
        </Card>
      </div>

      {/* My Stories */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <CardTitle>My Stories</CardTitle>
            <Link
              to="/stories"
              className="text-sm text-primary hover:underline"
            >
              View all
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
            <div className="space-y-3">
              {stories.map((story) => (
                <div
                  key={story._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/stories/${story._id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {story.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
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
                    className="ml-4 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icons.edit className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Link */}
      <Link to="/author/profile" className="block mt-6">
        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icons.settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Author Profile</p>
                <p className="text-sm text-muted-foreground">
                  Edit your bio, links, and avatar
                </p>
              </div>
            </div>
            <Icons.chevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </Link>
    </div>
  );
}
