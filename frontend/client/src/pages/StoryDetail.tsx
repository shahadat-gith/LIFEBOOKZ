import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storyApi } from '../api/stories';
import LikeButton from '../components/story/LikeButton';
import CommentSection from '../components/story/CommentSection';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';
import { Icons } from '../icons';
import type { Story } from '../types';

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!storyId) return;
    storyApi.getById(storyId).then(res => {
      setStory(res.data.data);
    }).catch(() => setError('Story not found')).finally(() => setLoading(false));
  }, [storyId]);

  if (loading) return <LoadingScreen message="Loading story..." />;
  if (error || !story) return <ErrorMessage message={error || 'Story not found'} onRetry={() => window.location.reload()} />;

  return <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto py-8 px-4">
    <header className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">{story.title}</h1>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {story.author && <div className="flex items-center gap-2"><Avatar src={story.author.avatar?.url} name={story.author.fullName} size="sm" /><span className="text-sm font-medium">{story.author.fullName}</span></div>}
        <span className="text-sm text-muted-foreground">{story.publishedAt ? new Date(story.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Draft'}</span>
      </div>
      {story.tags && story.tags.length > 0 && <div className="flex flex-wrap gap-2">{story.tags.map(t => <Badge key={t} variant="primary">#{t}</Badge>)}</div>}
      {story.summary?.content && <p className="text-lg text-muted-foreground mt-6 italic border-l-4 border-primary/30 pl-4">{story.summary.content}</p>}
    </header>
    <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: story.content }} />
    <div className="flex items-center gap-4 mt-10 py-4 border-y border-border"><LikeButton storyId={story._id} /></div>
    <div className="mt-10"><CommentSection storyId={story._id} /></div>
  </motion.article>;
}
