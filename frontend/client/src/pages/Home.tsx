import { useEffect, useState } from 'react';
import { searchApi } from '../api/search';
import { storyApi } from '../api/stories';
import Hero from '../components/home/Hero';
import Stats from '../components/home/Stats';
import HowItWorks from '../components/home/HowItWorks';
import FeaturedStories from '../components/home/FeaturedStories';
import TestimonialsSection from '../components/home/TestimonialsSection';
import CTASection from '../components/home/CTASection';

export function HomePage() {
  const [stories, setStories] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      storyApi.list({ limit: 8 }),
      searchApi.trending(8),
    ])
      .then(([latestRes, trendingRes]) => {
        const combined = [
          ...(trendingRes.data.results || []),
          ...(latestRes.data.stories || []),
        ];
        const seen = new Set<string>();
        const unique = combined.filter((s: Record<string, unknown>) => {
          const id = s._id as string;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setStories(unique.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Hero />
      <Stats />
      <FeaturedStories stories={stories} loading={loading} />
      <HowItWorks />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}

export default HomePage;
