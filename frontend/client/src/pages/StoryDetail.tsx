import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { storyApi } from '../api/stories';
import LikeButton from '../components/story/LikeButton';
import CommentSection from '../components/story/CommentSection';
import Avatar from '../components/ui/Avatar';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';
import { getContentPreview } from '../utils/helpers';
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

  // Must be called before early returns to obey Rules of Hooks
  const sanitizedContent = useMemo(
    () => (story?.content ? DOMPurify.sanitize(story.content) : ''),
    [story?.content],
  );

  if (loading) return <LoadingScreen message="Loading story..." />;
  if (error || !story) return <ErrorMessage message={error || 'Story not found'} onRetry={() => window.location.reload()} />;



  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto py-8 px-4"
    >
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          {getContentPreview(story.content, 120)}
        </h1>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {story.author && (
            <div className="flex items-center gap-2">
              <Avatar src={story.author.avatar?.url} name={story.author.fullName} size="sm" />
              <span className="text-sm font-medium">{story.author.fullName}</span>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {story.publishedAt
              ? new Date(story.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
              : 'Draft'}
          </span>
        </div>
        {story.summary?.content && (
          <p className="text-lg text-muted-foreground mt-6 italic border-l-4 border-primary/30 pl-4">
            {story.summary.content}
          </p>
        )}
      </header>

      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      <div className="flex items-center gap-4 mt-10 py-4 border-y border-border">
        <LikeButton storyId={story._id} initialLiked={story.likedByUser || false} />
      </div>

      <div className="mt-10">
        <CommentSection storyId={story._id} />
      </div>

      <style>{`
        .prose p { margin: 1.25em 0; line-height: 1.8; }
        .prose h1 { margin: 1.5em 0 0.5em; font-size: 2em; font-weight: 700; }
        .prose h2 { margin: 1.4em 0 0.5em; font-size: 1.6em; font-weight: 600; }
        .prose h3 { margin: 1.3em 0 0.5em; font-size: 1.3em; font-weight: 600; }
        .prose blockquote { margin: 1.5em 0; padding-left: 1em; border-left: 4px solid var(--color-primary); font-style: italic; color: var(--color-muted-foreground); }
        .prose ul, .prose ol { margin: 1em 0; padding-left: 1.5em; }
        .prose li { margin: 0.35em 0; }
        .prose pre { margin: 1.5em 0; padding: 1em; border-radius: 8px; background: #1f2937; color: #f8fafc; overflow-x: auto; }
        .prose code { background: var(--color-muted); border-radius: 4px; padding: 0.15em 0.35em; font-size: 0.875em; }
        .prose pre code { background: none; padding: 0; color: inherit; }
        .prose hr { margin: 2em 0; border-color: var(--color-border); }
      `}</style>
    </motion.article>
  );
}
