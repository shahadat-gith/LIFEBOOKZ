import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyApi } from '../../../services/apis/stories';
import { useAuth } from '../../../context/AuthContext';
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

export function StoryCreatePage() {
  const { author } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('en');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('language', language);
      tags.split(',').map((t) => t.trim()).filter(Boolean).forEach(t => formData.append('tags', t));
      if (bannerFile) formData.append('bannerImage', bannerFile);

      const { data: result } = await storyApi.create(formData);
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
              helperText="Add tags to help readers find your story"
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
                      Click to add a banner image
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
                placeholder="Once upon a time, in the bustling streets of Mumbai... Write your story here. Use blank lines to separate paragraphs."
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

export default StoryCreatePage;
