import { useState, useRef, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storyApi } from '../api/stories';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card, { CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import StoryEditor from '../components/editor/StoryEditor';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' }, { value: 'ja', label: 'Japanese' }, { value: 'zh', label: 'Chinese' },
  { value: 'pt', label: 'Portuguese' }, { value: 'ar', label: 'Arabic' }, { value: 'hi', label: 'Hindi' },
];

export default function StoryCreatePage() {
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

  const handleContentChange = useCallback((html: string) => setContent(html), []);
  function stripHtml(html: string): string { return html.replace(/<[^>]*>/g, '').trim(); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const plainText = stripHtml(content);
    if (!title.trim() || !plainText) { setError('Title and content are required'); return; }
    setError(''); setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content);
      formData.append('language', language);
      tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => formData.append('tags', t));
      if (bannerFile) formData.append('bannerImage', bannerFile);
      const { data: result } = await storyApi.create(formData);
      toast.success(result.message || 'Story submitted for verification!');
      navigate(result.status === 'final' ? `/stories/${result.story._id}` : '/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create story';
      setError(msg);
    } finally { setSubmitting(false); }
  }

  if (!author) { navigate('/login'); return null; }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Write a Story</h1>
        <p className="text-muted-foreground mt-1">Your story will undergo AI verification before publishing.</p>
      </motion.div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-5">
            <CardTitle>Story Details</CardTitle>
            <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., The Last Sunrise" required icon={<Icons.edit className="h-4 w-4" />} />
            <Select label="Language" value={language} onChange={e => setLanguage(e.target.value)} options={LANGUAGE_OPTIONS} />
            <Input label="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., romance, thriller, fantasy" icon={<Icons.tag className="h-4 w-4" />} helperText="Help readers find your story" />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Banner Image</label>
              <div onClick={() => bannerInputRef.current?.click()} className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={e => setBannerFile(e.target.files?.[0] || null)} className="hidden" />
                {bannerFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm text-foreground font-medium truncate max-w-[250px]">{bannerFile.name}</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setBannerFile(null); if (bannerInputRef.current) bannerInputRef.current.value = ''; }} className="text-muted-foreground hover:text-destructive transition-colors"><Icons.close className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm text-muted-foreground">Click to add a banner image</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Content <span className="text-destructive">*</span></label>
              <StoryEditor content={content} onChange={handleContentChange} placeholder="Once upon a time... Write your story here..." />
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Icons.edit className="h-3 w-3" />Rich text editor — use the toolbar above to format your story</p>
            </div>
            {error && <div className="text-sm text-destructive flex items-center gap-1.5"><Icons.exclamationCircle className="h-4 w-4" />{error}</div>}
          </CardContent>
          <CardFooter className="px-6 py-4 flex justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={submitting} size="lg" icon={<Icons.documentAdd className="h-4 w-4" />}>Submit Story</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
