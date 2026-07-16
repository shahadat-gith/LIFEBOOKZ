import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { storyApi } from '../api/stories';
import { searchApi } from '../api/search';
import LikeButton from '../components/story/LikeButton';
import CommentSection from '../components/story/CommentSection';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';
import StoryCard from '../components/story/StoryCard';
import { Icons } from '../icons';
import type { StoryAuthor } from '../types';

interface StoryData { _id: string; title: string; content: string; summary?: string; tags?: string[]; language?: string; bannerImage?: { url: string }; publishedAt?: string; createdAt: string; author?: StoryAuthor; }

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [similarStories, setSimilarStories] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!storyId) return;
    storyApi.getById(storyId).then(({ data }) => {
      setStory(data.story);
      searchApi.similar(storyId, 4).then(r => setSimilarStories(r.data.results || [])).catch(() => {});
    }).catch(() => setError('Story not found')).finally(() => setLoading(false));
  }, [storyId]);

  if (loading) return <LoadingScreen message="Loading story..." />;
  if (error || !story) return <ErrorMessage message={error || 'Story not found'} onRetry={() => window.location.reload()} />;

  return <article className="max-w-4xl mx-auto py-8 px-4">
    {story.bannerImage?.url && <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8 shadow-lg"><img src={story.bannerImage.url} alt={story.title} className="w-full h-full object-cover" /></div>}
    <header className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">{story.title}</h1>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {story.author && <div className="flex items-center gap-2"><Avatar src={story.author.avatar} name={story.author.fullName || story.author.name} size="sm" /><span className="text-sm font-medium">{story.author.fullName || story.author.name}</span></div>}
        <span className="text-sm text-muted-foreground">{story.publishedAt ? new Date(story.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Draft'}</span>
        {story.language && story.language !== 'en' && <Badge variant="info">{story.language.toUpperCase()}</Badge>}
      </div>
      {story.tags && story.tags.length > 0 && <div className="flex flex-wrap gap-2">{story.tags.map(t => <Badge key={t} variant="primary">#{t}</Badge>)}</div>}
      {story.summary && <p className="text-lg text-muted-foreground mt-4 italic border-l-4 border-primary/30 pl-4">{story.summary}</p>}
    </header>
    <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: story.content }} />
    <div className="flex items-center gap-4 mt-10 py-4 border-y border-border"><LikeButton storyId={story._id} /><button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary text-sm"><Icons.bookmark className="h-5 w-5" />Save</button></div>
    <div className="mt-10"><CommentSection storyId={story._id} /></div>
    {similarStories.length > 0 && <div className="mt-16"><h2 className="text-2xl font-bold mb-6">Similar Stories</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{similarStories.slice(0, 4).map(s => <StoryCard key={s._id as string} story={s as never} />)}</div></div>}
  </article>;
}
