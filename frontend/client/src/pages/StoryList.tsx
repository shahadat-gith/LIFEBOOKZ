import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storyApi } from '../api/stories';
import StoryCard from '../components/story/StoryCard';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Icons } from '../icons';

const LANGUAGE_OPTIONS = [
  { value: '', label: 'All Languages' }, { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }, { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' }, { value: 'pt', label: 'Portuguese' }, { value: 'ar', label: 'Arabic' }, { value: 'hi', label: 'Hindi' },
];
const SORT_OPTIONS = [{ value: 'latest', label: 'Latest' }, { value: 'trending', label: 'Trending' }];

export default function StoryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const language = searchParams.get('language') || '';
  const sort = searchParams.get('sort') || 'latest';

  async function loadStories(reset = false) {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 20 };
      if (language) params.language = language;
      if (!reset && cursor) params.cursor = cursor;
      const { data } = await storyApi.list(params);
      if (reset) setStories(data.stories || []);
      else setStories(p => [...p, ...(data.stories || [])]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { setCursor(null); loadStories(true); }, [language, sort]);

  function updateFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p);
  }

  return <div className="max-w-7xl mx-auto py-10 px-4">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div><h1 className="text-4xl font-bold">Explore <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Stories</span></h1><p className="text-muted-foreground mt-2">Discover captivating stories from authors around the world</p></div>
      <div className="flex gap-3"><div className="w-40"><Select options={LANGUAGE_OPTIONS} value={language} onChange={e => updateFilter('language', e.target.value)} /></div><div className="w-36"><Select options={SORT_OPTIONS} value={sort} onChange={e => updateFilter('sort', e.target.value)} /></div></div>
    </div>
    {loading && stories.length === 0 ? <div className="flex justify-center py-20"><Spinner size="lg" label="Loading stories..." /></div>
    : stories.length === 0 ? <EmptyState icon={<Icons.book className="h-16 w-16" />} title="No stories found" description="Try adjusting your filters." />
    : <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stories.map(s => <StoryCard key={s._id as string} story={s as never} />)}
      </div>
      {hasMore && <div className="flex justify-center mt-12"><Button variant="outline" size="lg" loading={loading} onClick={() => loadStories(false)}>Load More</Button></div>}
    </>}
  </div>;
}
