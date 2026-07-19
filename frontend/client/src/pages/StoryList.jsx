import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../config/axios";
import StoryCard from "../components/story/StoryCard"
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

export default function StoryListPage() {
  const [searchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const tag = searchParams.get("tag") || "";

  async function loadStories(p) {
    setLoading(true);
    try {
      const params = { limit: 20, page: p };
      if (tag) params.tag = tag;
      const res = await api.get("/stories", { params });
      const data = res.data.data;
      setStories(data.stories || []);
      setPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    loadStories(1);
  }, [tag]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold">
            Explore{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Stories</span>
          </h1>
          <p className="text-muted-foreground mt-2">Discover captivating stories from authors around the world</p>
        </div>
      </div>
      {loading && stories.length === 0 ? (
        <div className="flex justify-center py-20"><Spinner size="lg" label="Loading stories..." /></div>
      ) : stories.length === 0 ? (
        <EmptyState icon={<Icons.book className="h-16 w-16" />} title="No stories found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stories.map((s) => <StoryCard key={s._id} story={s} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => loadStories(page - 1)}>Previous</Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => loadStories(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
