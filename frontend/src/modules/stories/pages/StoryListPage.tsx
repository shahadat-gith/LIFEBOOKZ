import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storyApi } from '../../../services/apis/stories';
import StoryCard from '../components/StoryCard';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/utilities/EmptyState';
import { Icons } from '../../../icons';

const LANGUAGE_OPTIONS = [
  { value: '', label: 'All Languages' },
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

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'trending', label: 'Trending' },
];

export default function StoryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const language = searchParams.get('language') || '';
  const sort = searchParams.get('sort') || 'latest';

  async function loadStories(reset = false) {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 20 };
      if (language) params.language = language;
      if (!reset && cursor) params.cursor = cursor;

      const { data } = await storyApi.list(params);
      if (reset) {
        setStories(data.stories || []);
      } else {
        setStories((prev) => [...prev, ...(data.stories || [])]);
      }
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCursor(null);
    loadStories(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, sort]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stories</h1>
          <p className="text-muted-foreground mt-1">Discover stories from authors around the world</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40">
            <Select
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={(e) => updateFilter('language', e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              options={SORT_OPTIONS}
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      {loading && stories.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<Icons.book className="h-16 w-16" />}
          title="No stories found"
          description="Try adjusting your filters or check back later for new stories."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stories.map((story) => (
              <StoryCard key={story._id as string} story={story as never} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <Button
                variant="outline"
                size="lg"
                loading={loading}
                onClick={() => loadStories(false)}
                icon={<Icons.chevronDown className="h-4 w-4" />}
              >
                Load More Stories
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
