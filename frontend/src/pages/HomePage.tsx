import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../services/apis/search';
import { storyApi } from '../services/apis/stories';
import StoryCard from '../modules/stories/components/StoryCard';
import SearchBar from '../modules/search/components/SearchBar';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { Icons } from '../icons';

export default function HomePage() {
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
        // Deduplicate by _id
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Icons.sparkles className="h-4 w-4" />
            AI-Powered Story Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 font-display">
            Where Stories Come
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"> Alive</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover, read, and share amazing stories from writers around the world.
            Our AI-powered platform helps authors craft better content.
          </p>
          <div className="max-w-xl mx-auto mb-6">
            <SearchBar large />
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link to="/stories">
              <Button size="lg" variant="primary" icon={<Icons.book className="h-5 w-5" />}>
                Explore Stories
              </Button>
            </Link>
            <Link to="/author/register">
              <Button size="lg" variant="outline" icon={<Icons.edit className="h-5 w-5" />}>
                Start Writing
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative gradient blobs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icons.sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">AI Enhancement</h3>
            <p className="text-sm text-muted-foreground">
              Get AI-powered grammar correction, content suggestions, and title ideas.
            </p>
          </Card>
          <Card padding="lg" className="text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Icons.search className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Semantic Search</h3>
            <p className="text-sm text-muted-foreground">
              Find stories that match your interests with AI-powered semantic search.
            </p>
          </Card>
          <Card padding="lg" className="text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Icons.shieldCheck className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Content Safety</h3>
            <p className="text-sm text-muted-foreground">
              Every story is verified by AI to ensure safe and appropriate content.
            </p>
          </Card>
        </div>
      </section>

      {/* Latest / Trending Stories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Featured Stories</h2>
            <p className="text-muted-foreground mt-1">Discover trending and latest stories</p>
          </div>
          <Link to="/stories">
            <Button variant="ghost" icon={<Icons.arrowRight className="h-4 w-4" />}>
              View All
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : stories.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Icons.book className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground">No stories yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to share your story with the world!
            </p>
            <Link to="/author/register" className="inline-block mt-4">
              <Button variant="primary">Become an Author</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stories.map((story) => (
              <StoryCard key={story._id as string} story={story as never} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
