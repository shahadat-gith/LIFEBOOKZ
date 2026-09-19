import { useCallback, useEffect, useState } from "react";
import api from "../config/api";

/**
 * The published-story feed shown on home ("Stories For You").
 *
 * Home is author-only, so the author's own lifebooks are filtered out — this
 * is about reading other people's lives, not your own. Loading is tracked
 * separately from the rest of the page so the feed never blocks the shell.
 */
export default function useStoryFeed({ limit = 10, excludeAuthorId = null } = {}) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/stories", { params: { type: "latest", limit } });
      const rows = res.data?.data?.stories || [];
      setStories(
        rows.filter((s) => String(s.author?._id || s.author?.id || s.author) !== String(excludeAuthorId)),
      );
      setError(null);
    } catch (err) {
      setError(err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [limit, excludeAuthorId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stories, loading, error, reload: load };
}
