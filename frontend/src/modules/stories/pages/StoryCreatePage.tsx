import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyApi } from '../../../services/apis/stories';
import { useAuth } from '../../../store/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Select from '../../../components/ui/Select';
import Card, { CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
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

export default function StoryCreatePage() {
  const { author } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('en');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const data = {
        title: title.trim(),
        content: content.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        language,
      };
      const { data: result } = await storyApi.create(data);
      toast.success(result.message || 'Story submitted for verification!');

      if (result.status === 'final') {
        navigate(`/stories/${result.story._id}`);
      } else {
        navigate('/author/dashboard');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to create story';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!author) {
    navigate('/author/login');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Write a Story</h1>
        <p className="text-muted-foreground mt-1">
          Share your story with the world. It will be verified by AI before publishing.
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
              placeholder="Enter your story title"
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
              placeholder="fiction, adventure, romance..."
              icon={<Icons.tag className="h-4 w-4" />}
              helperText="Add tags to help readers find your story"
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Content <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your story here... Use blank lines to separate paragraphs."
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

          <CardFooter className="px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              size="lg"
              icon={<Icons.documentAdd className="h-4 w-4" />}
            >
              Submit Story
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card padding="md" className="mt-6 border-info/20 bg-info/5">
        <div className="flex items-start gap-3">
          <Icons.infoCircle className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground/80">
            <p className="font-medium text-info mb-1">What happens after you submit?</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Your story undergoes AI verification for content guidelines</li>
              <li>If approved, grammar is corrected and a summary is generated</li>
              <li>The story gets published and embedded for semantic search</li>
              <li>If issues are found, you&apos;ll receive feedback to update your story</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
