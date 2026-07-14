import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storyApi } from '../../../services/apis/stories';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Select from '../../../components/ui/Select';
import Card, { CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import LoadingScreen from '../../../components/utilities/LoadingScreen';
import ErrorMessage from '../../../components/utilities/ErrorMessage';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
];

export function StoryEditPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { author } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!storyId || !author) return;
    storyApi
      .getById(storyId)
      .then(({ data }) => {
        const story = data.story;
        if (story.author?._id !== author._id && story.author !== author._id) {
          setFetchError('You can only edit your own stories');
          return;
        }
        setTitle(story.title || '');
        setContent(story.content || '');
        setTags((story.tags || []).join(', '));
        setLanguage(story.language || 'en');
      })
      .catch(() => setFetchError('Story not found'))
      .finally(() => setLoading(false));
  }, [storyId, author]);

  function buildFormData() {
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('content', content.trim());
    fd.append('language', language);
    tags.split(',').map((t) => t.trim()).filter(Boolean).forEach(t => fd.append('tags', t));
    if (bannerFile) fd.append('bannerImage', bannerFile);
    return fd;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const { data } = await storyApi.update(storyId!, buildFormData());
      toast.success('Story updated. Re-submit for verification to publish changes.');
      navigate(`/stories/${data._id || storyId}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to update story';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResubmit() {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await storyApi.resubmit(storyId!, buildFormData());
      toast.success(data.message || 'Story re-submitted for verification');
      navigate('/author/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to resubmit';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!author) {
    navigate('/author/login');
    return null;
  }

  if (loading) return <LoadingScreen message="Loading story..." />;
  if (fetchError) return <ErrorMessage message={fetchError} onRetry={() => navigate('/author/dashboard')} />;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Edit Story</h1>
        <p className="text-muted-foreground mt-1">
          Update your story and re-submit for AI verification.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-5">
            <CardTitle>Story Details</CardTitle>

            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Last Sunrise Over Varanasi"
              required
              icon={<Icons.edit className="h-4 w-4" />}
            />

            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={LANGUAGE_OPTIONS}
            />

            <Input
              label="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., mythology, romance, thriller, poetry, fantasy"
              icon={<Icons.tag className="h-4 w-4" />}
            />

            {/* Banner Image Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Banner Image
              </label>
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {bannerFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm text-foreground font-medium truncate max-w-[250px]">
                      {bannerFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBannerFile(null); if (bannerInputRef.current) bannerInputRef.current.value = ''; }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Icons.close className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm text-muted-foreground">
                      Click to change banner image
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Content <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Edit your story... Use blank lines to separate paragraphs."
                rows={16}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length.toLocaleString()} / 100,000 characters
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive flex items-center gap-1.5">
                <Icons.exclamationCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="px-6 py-4 flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <div className="flex-1" />
            <Button
              type="submit"
              variant="outline"
              loading={submitting}
              icon={<Icons.save className="h-4 w-4" />}
            >
              Save Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={submitting}
              onClick={handleResubmit}
              icon={<Icons.refresh className="h-4 w-4" />}
            >
              Save & Re-submit
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default StoryEditPage;
