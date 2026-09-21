import { useCallback, useEffect, useState } from "react";
import * as storyClient from "../utils/storyApi";

/**
 * The author's own lifebooks (chapters + their stories).
 *
 * Loaded on demand by the screens that show them — the profile reads the
 * chapters, home reads the drafts — and reloadable after any edit so the
 * numbers on screen always match the data behind them.
 */
export default function useMyStories({ enabled = true } = {}) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storyClient.getMyStories();
      setStories(data || []);
      setError(null);
      return data || [];
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { stories, setStories, loading, error, reload: load };
}
