import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../../config/axios";
import StoryCard from "../../components/story/StoryCard";
import Spinner from "../../components/ui/Spinner";
import NoDataState from "../../components/common/NoDataState";
import ErrorState from "../../components/common/ErrorState";
import { Icons } from "../../icons";

const GRID_CLASS = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

/** Search results for the query in the URL. */
export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");

    api
      .get("/search", { params: { q: query, limit: 30 } })
      .then((res) => setResults(res.data.data.results || []))
      .catch((err) => {
        setResults([]);
        setError(
          err.response?.data?.error?.message ||
            "We couldn't run that search. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Search</h1>
      </div>

      {query && (
        <p className="mb-6 text-sm text-muted-foreground">
          {loading
            ? "Searching..."
            : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Searching..." />
        </div>
      ) : error ? (
        <ErrorState title="Search didn't run" message={error} />
      ) : !query ? (
        <NoDataState
          icon={Icons.search}
          title="Search stories"
          description="Enter a search query to find stories."
        />
      ) : results.length === 0 ? (
        <NoDataState
          icon={Icons.book}
          title="No results found"
          description={`No stories matched "${query}".`}
        />
      ) : (
        <div className={GRID_CLASS}>
          {results.map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
