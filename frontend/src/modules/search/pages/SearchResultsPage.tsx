import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchApi } from '../../../services/apis/search';
import SearchBar from '../components/SearchBar';
import StoryCard from '../../stories/components/StoryCard';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/utilities/EmptyState';
import { Icons } from '../../../icons';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    searchApi
      .search({ q: query })
      .then(({ data }) => {
        setResults(data.results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>
        <SearchBar large initialQuery={query} className="max-w-2xl" />
      </div>

      {query && (
        <p className="text-sm text-muted-foreground mb-6">
          {loading
            ? 'Searching...'
            : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Searching..." />
        </div>
      ) : !query ? (
        <EmptyState
          icon={<Icons.search className="h-16 w-16" />}
          title="Search stories"
          description="Enter a search query to find stories using semantic search."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Icons.book className="h-16 w-16" />}
          title="No results found"
          description={`No stories matched "${query}". Try different keywords.`}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((story) => (
            <StoryCard key={story._id as string} story={story as never} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;
