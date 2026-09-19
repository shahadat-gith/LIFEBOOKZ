import { useCallback, useEffect, useState } from "react";
import * as storyClient from "../utils/client";

/**
 * Social counters for the author's profile (followers / following / likes).
 *
 * Chapters and stories are deliberately *not* read here — they are counted
 * from the lifebooks the profile already has loaded, so every view of a
 * chapter shows the same number.
 */
export default function useSocialStats({ enabled = true } = {}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storyClient.getMyStats();
      setStats(data || null);
      setError(null);
      return data;
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

  return { stats, loading, error, reload: load };
}
