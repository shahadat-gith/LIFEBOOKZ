import { useState, useEffect, type FormEvent } from 'react';
import { storyApi } from '../../../services/apis/stories';
import { useAuth } from '../../../context/AuthContext';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Textarea from '../../../components/ui/Textarea';
import Spinner from '../../../components/ui/Spinner';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Comment {
  _id: string;
  id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface CommentSectionProps {
  storyId: string;
}

export function CommentSection({ storyId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function loadComments() {
    try {
      const { data } = await storyApi.listComments(storyId, { cursor: cursor || undefined });
      if (cursor) {
        setComments((prev) => [...prev, ...data.comments]);
      } else {
        setComments(data.comments || []);
      }
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      toast('Sign in to comment');
      navigate('/login');
      return;
    }
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await storyApi.addComment(storyId, { content: content.trim() });
      setComments((prev) => [data, ...prev]);
      setContent('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
        <Icons.chat className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          {isAuthenticated && (
            <Avatar src={user?.avatar} name={user?.name} size="sm" className="mt-1 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAuthenticated ? 'Write a comment...' : 'Sign in to comment'}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                loading={submitting}
                disabled={!content.trim()}
                icon={<Icons.chat className="h-4 w-4" />}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Icons.chat className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <Avatar
                src={comment.user?.avatar}
                name={comment.user?.name}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {comment.user?.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadComments}
                icon={<Icons.chevronDown className="h-4 w-4" />}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
