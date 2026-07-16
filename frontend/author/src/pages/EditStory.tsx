import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as storyApi from '../api/stories';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import StoryEditor from '../components/editor/StoryEditor';
import LoadingScreen from '../components/common/LoadingScreen';
import { Icons } from '../icons';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';

export default function StoryEditPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { author, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Polling state for resubmit
  const [polling, setPolling] = useState(false);
  const [pollMessage, setPollMessage] = useState('');
  const [issues, setIssues] = useState<Array<{ description: string; suggestion: string }>>([]);
  const [storyStatus, setStoryStatus] = useState<string>('');

  const handleContentChange = useCallback((html: string) => setContent(html), []);
  const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').trim();

  useEffect(() => {
    if (!storyId || !author) return;
    storyApi.getMyStory(storyId)
      .then((s) => {
        setTitle(s.title || '');
        setContent(s.content || '');
        setTags((s.tags || []).join(', '));
        setStoryStatus(s.status);
      })
      .catch(() => setError('Story not found'))
      .finally(() => setLoading(false));
  }, [storyId, author]);

  // Polling effect for resubmit
  useEffect(() => {
    if (!storyId || !polling) return;

    const interval = setInterval(async () => {
      try {
        const s = await storyApi.getMyStory(storyId);
        if (s.status === 'published') {
          clearInterval(interval);
          setPolling(false);
          toast.success('Story published!');
          navigate('/dashboard');
        } else if (s.status === 'rejected') {
          clearInterval(interval);
          setPolling(false);
          setStoryStatus('rejected');
          if (s.verification?.issues) {
            setIssues(s.verification.issues);
          }
          toast.error('Story was rejected');
        }
      } catch {
        // continue polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [storyId, polling, navigate]);

  async function handleSaveDraft(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !stripHtml(content)) {
      setError('Title and content are required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await storyApi.update(storyId!, {
        title: title.trim(),
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Draft saved successfully');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to update story');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!title.trim() || !stripHtml(content)) {
      setError('Title and content are required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await storyApi.update(storyId!, {
        title: title.trim(),
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      await storyApi.submit(storyId!);
      setPolling(true);
      setPollMessage('Story submitted! Re-analyzing your story...');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <LoadingScreen message="Loading..." />;
  if (!author) { navigate('/login'); return null; }
  if (loading) return <LoadingScreen message="Loading story..." />;

  if (error && !title) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card padding="lg" className="text-center">
          <div className="mb-4">
            <Icons.exclamationCircle className="h-12 w-12 text-destructive mx-auto" />
          </div>
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Polling state
  if (polling) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Icons.sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Re-analyzing Your Story</h2>
        <p className="text-muted-foreground mb-6">{pollMessage}</p>
        <div className="flex justify-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground">Edit Story</h1>
          {storyStatus && (
            <Badge
              variant={
                storyStatus === 'published' ? 'success' :
                storyStatus === 'rejected' ? 'danger' :
                storyStatus === 'draft' ? 'warning' : 'info'
              }
            >
              {storyStatus.charAt(0).toUpperCase() + storyStatus.slice(1)}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">Update your story and re-submit for AI verification.</p>
      </motion.div>

      {/* Verification Issues Banner */}
      <AnimatePresence>
        {storyStatus === 'rejected' && issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-5 rounded-2xl bg-destructive/5 border border-destructive/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icons.exclamationCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">Verification Issues</h3>
            </div>
            {issues.map((issue, i) => (
              <div key={i} className="mb-2 pb-2 border-b border-destructive/10 last:border-0 last:mb-0 last:pb-0">
                <p className="text-sm text-foreground">{issue.description}</p>
                {issue.suggestion && (
                  <p className="text-xs text-muted-foreground mt-0.5">Suggestion: {issue.suggestion}</p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSaveDraft}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6 space-y-5">
            <CardTitle>Story Details</CardTitle>

            <Input
              label="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              icon={<Icons.edit className="h-4 w-4" />}
            />

            <Input
              label="Tags (comma-separated)"
              value={tags}
              onChange={e => setTags(e.target.value)}
              icon={<Icons.tag className="h-4 w-4" />}
              helperText="Help readers find your story"
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Content <span className="text-destructive">*</span>
              </label>
              <StoryEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Edit your story..."
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-destructive flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10"
                >
                  <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="outline"
                loading={saving && !polling}
                icon={<Icons.save className="h-4 w-4" />}
              >
                Save Draft
              </Button>
              {storyStatus !== 'published' && (
                <Button
                  type="button"
                  loading={saving && !polling}
                  onClick={handleSubmitForReview}
                  icon={<Icons.refresh className="h-4 w-4" />}
                >
                  Save & Submit
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.form>
    </div>
  );
}
