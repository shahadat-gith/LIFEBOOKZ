import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storyApi } from '../../../services/apis/stories';
import { searchApi } from '../../../services/apis/search';
import { useAuth } from '../../../store/AuthContext';
import LikeButton from '../components/LikeButton';
import CommentSection from '../components/CommentSection';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import LoadingScreen from '../../../components/utilities/LoadingScreen';
import ErrorMessage from '../../../components/utilities/ErrorMessage';
import StoryCard from '../components/StoryCard';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';

interface StoryData {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  language?: string;
  bannerImage?: { url: string };
  publishedAt?: string;
  createdAt: string;
  author?: {
    _id: string;
    fullName?: string;
    name?: string;
    avatar?: string;
    bio?: string;
  };
}

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { author: currentAuthor } = useAuth();
  const [story, setStory] = useState<StoryData | null>(null);
  const [verification, setVerification] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [similarStories, setSimilarStories] = useState<Array<Record<string, unknown>>>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStory() {
      if (!storyId) return;
      try {
        const { data } = await storyApi.getById(storyId);
        setStory(data.story);
        setVerification(data.verification);

        // Fetch similar stories
        searchApi.similar(storyId, 4).then((res) => {
          setSimilarStories(res.data.results || []);
        }).catch(() => {});
      } catch {
        setError('Story not found');
      } finally {
        setLoading(false);
      }
    }
    fetchStory();
  }, [storyId]);

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await storyApi.remove(storyId!);
      toast.success('Story deleted');
      navigate('/author/dashboard');
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function handleEnhance() {
    setEnhancing(true);
    try {
      const { data } = await storyApi.enhance(storyId!);
      setEnhancedContent(data.enhanced);
      toast.success('AI enhancement complete');
    } catch {
      toast.error('Failed to enhance');
    } finally {
      setEnhancing(false);
    }
  }

  if (loading) return <LoadingScreen message="Loading story..." />;
  if (error || !story) return <ErrorMessage message={error || 'Story not found'} onRetry={() => window.location.reload()} />;

  const isOwner = currentAuthor?._id === (story.author?._id || '');

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Banner */}
      {story.bannerImage?.url && (
        <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8 shadow-lg">
          <img
            src={story.bannerImage.url}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
          {story.title}
        </h1>

        {/* Author & Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {story.author && (
            <Link
              to={`/authors/${story.author._id}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar src={story.author.avatar} name={story.author.fullName || story.author.name} size="sm" />
              <span className="text-sm font-medium text-foreground">
                {story.author.fullName || story.author.name}
              </span>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {story.publishedAt
              ? new Date(story.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Draft'}
          </span>
          {story.language && story.language !== 'en' && (
            <Badge variant="info">{story.language.toUpperCase()}</Badge>
          )}
        </div>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {story.tags.map((tag) => (
              <Badge key={tag} variant="primary">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Summary */}
        {story.summary && (
          <p className="text-lg text-muted-foreground mt-4 italic border-l-4 border-primary/30 pl-4">
            {story.summary}
          </p>
        )}
      </header>

      {/* Author Actions */}
      {isOwner && (
        <Card padding="md" className="mb-8 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Icons.edit className="h-4 w-4" />
              Author Controls
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/stories/${story._id}/edit`}>
                <Button variant="outline" size="sm" icon={<Icons.edit className="h-4 w-4" />}>
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                loading={enhancing}
                onClick={handleEnhance}
                icon={<Icons.sparkles className="h-4 w-4" />}
              >
                Enhance with AI
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                icon={<Icons.trash className="h-4 w-4" />}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI Verification Status */}
      {isOwner && verification && (
        <Card padding="sm" className={`mb-6 ${verification.status === 'final' ? 'border-success/30 bg-success/5' : verification.status === 'issues_found' ? 'border-warning/30 bg-warning/5' : 'border-muted bg-muted/30'}`}>
          <div className="flex items-center gap-2 text-sm">
            {verification.status === 'final' ? (
              <><Icons.checkCircle className="h-4 w-4 text-success" /> <span className="text-success font-medium">Verified & Published</span></>
            ) : verification.status === 'issues_found' ? (
              <><Icons.exclamationCircle className="h-4 w-4 text-warning" /> <span className="text-warning font-medium">Issues Found — Review Required</span></>
            ) : verification.status === 'in_progress' ? (
              <><Icons.spinner className="h-4 w-4 animate-spin text-info" /> <span className="text-info font-medium">AI Verification in Progress...</span></>
            ) : (
              <><Icons.clock className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Pending Verification</span></>
            )}
          </div>
        </Card>
      )}

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {(enhancedContent || story.content).split('\n').map((paragraph, i) =>
          paragraph.trim() ? (
            <p key={i} className="mb-4 leading-relaxed text-foreground/90">
              {paragraph}
            </p>
          ) : null
        )}
      </div>

      {/* Enhanced Content Banner */}
      {enhancedContent && (
        <Card padding="md" className="mt-6 border-accent/30 bg-accent/5">
          <div className="flex items-start gap-3">
            <Icons.sparkles className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">AI-Enhanced Version</p>
              <p className="text-sm text-muted-foreground">
                This content has been enhanced by AI. The original version is preserved.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions Bar */}
      <div className="flex items-center gap-4 mt-10 py-4 border-y border-border">
        <LikeButton storyId={story._id} />
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
          <Icons.bookmark className="h-5 w-5" />
          Save
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
          <Icons.share className="h-5 w-5" />
          Share
        </button>
      </div>

      {/* Comments */}
      <div className="mt-10">
        <CommentSection storyId={story._id} />
      </div>

      {/* Similar Stories */}
      {similarStories.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Similar Stories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {similarStories.slice(0, 4).map((s: Record<string, unknown>) => (
              <StoryCard key={s._id as string} story={s as never} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
