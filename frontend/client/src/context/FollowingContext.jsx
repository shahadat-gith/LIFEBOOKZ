import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from "../config/axios";
import { useAuth } from "./AuthContext";

const FollowingContext = createContext(undefined);

export function FollowingProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [followingIds, setFollowingIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const prevUserIdRef = useRef(null);

  // Fetch the user's following list whenever the user changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setFollowingIds(new Set());
      prevUserIdRef.current = null;
      return;
    }

    const userId = user.id || user._id;
    if (!userId) return;

    // Avoid re-fetching if user hasn't changed
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;

    setIsLoading(true);
    api
      .get(`/following/user/${userId}/following`)
      .then((res) => {
        const data = res.data.data || [];
        const ids = new Set(data.map((f) => f.whom?._id?.toString() || f.whom?.toString()));
        setFollowingIds(ids);
      })
      .catch(() => {
        // Silently fail, fall back to empty set
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, user]);

  const isFollowing = useCallback(
    (authorId) => followingIds.has(authorId),
    [followingIds]
  );

  const follow = useCallback(
    async (authorId) => {
      // Optimistic update
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.add(authorId);
        return next;
      });

      try {
        await api.post(`/following/${authorId}/follow`);
      } catch {
        // Revert on failure
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(authorId);
          return next;
        });
        throw new Error("Failed to follow author");
      }
    },
    []
  );

  const unfollow = useCallback(
    async (authorId) => {
      // Optimistic update
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(authorId);
        return next;
      });

      try {
        await api.delete(`/following/${authorId}/follow`);
      } catch {
        // Revert on failure
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.add(authorId);
          return next;
        });
        throw new Error("Failed to unfollow author");
      }
    },
    []
  );

  return (
    <FollowingContext.Provider
      value={{ followingIds, isFollowing, follow, unfollow, isLoading }}
    >
      {children}
    </FollowingContext.Provider>
  );
}

export function useFollowing() {
  const c = useContext(FollowingContext);
  if (!c) throw new Error('useFollowing must be used within FollowingProvider');
  return c;
}

export default FollowingProvider;
