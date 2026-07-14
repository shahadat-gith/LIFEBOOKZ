import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export function StoryListPage() {
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 blur-3xl rounded-full" />

      {/* Decorative dots */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display">
              Explore{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Stories
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Discover captivating stories from authors around the world
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-3"
          >
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
          </motion.div>
        </motion.div>

        {/* Stories Grid */}
        {loading && stories.length === 0 ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" label="Loading stories..." />
          </div>
        ) : stories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EmptyState
              icon={<Icons.book className="h-16 w-16" />}
              title="No stories found"
              description="Try adjusting your filters or check back later for new stories."
            />
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {stories.map((story) => (
                <motion.div key={story._id as string} variants={cardVariants}>
                  <StoryCard story={story as never} />
                </motion.div>
              ))}
            </motion.div>

            {/* Load More */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex justify-center mt-12"
              >
                <Button
                  variant="outline"
                  size="lg"
                  loading={loading}
                  onClick={() => loadStories(false)}
                  icon={<Icons.chevronDown className="h-4 w-4" />}
                  className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 px-8"
                >
                  Load More Stories
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default StoryListPage;
