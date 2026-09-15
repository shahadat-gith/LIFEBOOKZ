import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Time-ago formatter shared by notification UIs.
 */
export function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/**
 * In-app notifications for the signed-in account (user, author or expert).
 *
 * - Polls unread count every 30s
 * - Fetches the list lazily when the drawer opens
 * - markRead / markAllRead keep local state consistent
 */
export function useNotifications(apiClient, { enabled = true } = {}) {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const refreshUnread = useCallback(async () => {
    if (!enabledRef.current) return;
    try {
      const res = await apiClient.get("/notifications/unread-count");
      setUnread(res.data?.data?.count || 0);
    } catch {
      // Silent — the badge is cosmetic; API may briefly be unavailable.
    }
  }, [apiClient]);

  const fetchItems = useCallback(
    async ({ append = false, before } = {}) => {
      if (!enabledRef.current) return;
      setLoading(true);
      try {
        const res = await apiClient.get("/notifications", {
          params: { limit: 20, before: append ? before : undefined },
        });
        const data = res.data?.data || {};
        const newItems = data.items || [];
        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setHasMore(Boolean(data.nextBefore));
        setLoaded(true);
      } catch {
        if (!append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  const markRead = useCallback(
    async (id) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnread((c) => Math.max(0, c - 1));
      try {
        await apiClient.patch(`/notifications/${id}/read`);
      } catch {
        // Local state already applied; server will reconcile on next load.
      }
    },
    [apiClient],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await apiClient.patch("/notifications/read-all");
    } catch {
      // Silent.
    }
  }, [apiClient]);

  const remove = useCallback(
    async (id) => {
      const snapshot = items;
      setItems((prev) => prev.filter((n) => n.id !== id));
      try {
        await apiClient.delete(`/notifications/${id}`);
        refreshUnread();
      } catch {
        setItems(snapshot);
      }
    },
    [apiClient, items, refreshUnread],
  );

  // Poll the unread badge while enabled.
  useEffect(() => {
    if (!enabled) return undefined;
    refreshUnread();
    const timer = setInterval(refreshUnread, 30_000);
    return () => clearInterval(timer);
  }, [enabled, refreshUnread]);

  return {
    unread,
    items,
    loading,
    loaded,
    hasMore,
    fetchItems,
    refreshUnread,
    markRead,
    markAllRead,
    remove,
  };
}

export default useNotifications;
