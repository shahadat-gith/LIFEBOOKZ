import { useEffect, useState, useRef, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storyApi } from '../api/stories';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card, { CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import StoryEditor from '../components/editor/StoryEditor';
import LoadingScreen from '../components/common/LoadingScreen';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' }, { value: 'ja', label: 'Japanese' }, { value: 'zh', label: 'Chinese' },
  { value: 'pt', label: 'Portuguese' }, { value: 'ar', label: 'Arabic' }, { value: 'hi', label: 'Hindi' },
];

export default function StoryEditPage() {
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
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleContentChange = useCallback((html: string) => setContent(html), []);
  function stripHtml(html: string): string { return html.replace(/<[^>]*>/g, '').trim(); }

  useEffect(() => {
    if (!storyId || !author) return;
    storyApi.getById(storyId).then(({ data }) => {
      const s = data.story || data;
      if (s.author?._id !== author._id && s.author !== author._id) {
        setError('You can only edit your own stories');
        return;
      }
      setTitle(s.title || '');
      setContent(s.content || '');
      setTags((s.tags || []).join(', '));
      setLanguage(s.language || 'en');
    }).catch(() => setError('Story not found')).finally(() => setLoading(false));
  }, [storyId, author]);

  function buildFormData() {
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('content', content);
    fd.append('language', language);
    tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => fd.append('tags', t));
    if (bannerFile) fd.append('bannerImage', bannerFile);
    return fd;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !stripHtml(content)) { setError('Title and content are required'); return; }
    setError(''); setSubmitting(true);
    try {
      await storyApi.update(storyId!, buildFormData());
      toast.success('Story updated.');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update';
      setError(msg);
    } finally { setSubmitting(false); }
  }

  async function handleResubmit() {
    if (!title.trim() || !stripHtml(content)) { setError('Title and content are required'); return; }
    setError(''); setSubmitting(true);
    try {
      const { data } = await storyApi.resubmit(storyId!, buildFormData());
      toast.success(data.message || 'Re-submitted for verification');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resubmit';
      setError(msg);
    } finally { setSubmitting(false); }
  }

  if (!author) { navigate('/login'); return null; }
  if (loading) return <LoadingScreen message="Loading story..." />;
  if (error && !title) return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Card padding="lg" className="text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Edit Story</h1>
        <p className="text-muted-foreground mt-1">Update your story and re-submit for AI verification.</p>
      </motion.div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-5">
            <CardTitle>Story Details</CardTitle>
            <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} required icon={<Icons.edit className="h-4 w-4" />} />
            <Select label="Language" value={language} onChange={e => setLanguage(e.target.value)} options={LANGUAGE_OPTIONS} />
            <Input label="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} icon={<Icons.tag className="h-4 w-4" />} />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Banner Image</label>
              <div onClick={() => bannerInputRef.current?.click()} className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={e => setBannerFile(e.target.files?.[0] || null)} className="hidden" />
                {bannerFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm text-foreground font-medium truncate">{bannerFile.name}</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setBannerFile(null); }} className="text-muted-foreground hover:text-destructive"><Icons.close className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm text-muted-foreground">Click to change banner image</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Content <span className="text-destructive">*</span></label>
              <StoryEditor content={content} onChange={handleContentChange} placeholder="Edit your story..." />
            </div>
            {error && <div className="text-sm text-destructive flex items-center gap-1.5"><Icons.exclamationCircle className="h-4 w-4" />{error}</div>}
          </CardContent>
          <CardFooter className="px-6 py-4 flex-wrap gap-2 justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <div className="flex gap-2">
              <Button type="submit" variant="outline" loading={submitting} icon={<Icons.save className="h-4 w-4" />}>Save Draft</Button>
              <Button type="button" variant="primary" loading={submitting} onClick={handleResubmit} icon={<Icons.refresh className="h-4 w-4" />}>Save & Re-submit</Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
