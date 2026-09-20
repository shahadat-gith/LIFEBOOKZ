import { useCallback, useEffect, useState } from "react";
import api from "../config/api";

/** Notification types that represent something happening *to* a story. */
const STORY_ACTIVITY = new Set(["like", "comment"]);

/**
 * Recent activity on the author's stories.
 *
 * The notification stream already carries everything needed — who did it
 * (resolved from their own account, so names and pictures are current), what
 * they did, and a link to the story — so the dashboard reads it rather than
 * inventing a second activity log.
 */
export default function useMyActivity({ enabled = true, limit = 30 } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications", { params: { limit } });
      const all = res.data?.data?.items || [];
      setItems(all.filter((n) => STORY_ACTIVITY.has(n.type)));
      setError(null);
      return all;
    } catch (err) {
      setError(err);
      setItems([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  /** Clear the unread dot once a row has been opened. */
  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // Local state is already applied; the API reconciles on the next load.
    }
  }, []);

  return { items, loading, error, reload: load, markRead };
}
