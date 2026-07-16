import { useEffect, useState } from 'react';
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
    storyApi.list({ limit: 8 })
      .then(res => {
        const data = res.data.data;
        setStories(data.stories || []);
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
