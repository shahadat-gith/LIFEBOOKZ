import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../config/api";
import { useAuth } from "../context/AuthContext";
import { share } from "../utils/share";

/**
 * The two things a reader can do to a story — like it and share it.
 *
 * The feed card and the full reader offer the same pair of actions, so the
 * optimistic like toggle, its rollback on failure and the share fallback are
 * written once here instead of twice.
 *
 * Cards wrap their actions in a link to the story, so both handlers stop the
 * event when they are given one.
 */
export default function useStoryActions(story) {
  const storyId = story?._id;
  const storyTitle = story?.title || "Untitled Story";
  const storySlug = story?.slug || storyId;

  const navigate = useNavigate();
  const { author: viewer, isAuthenticated } = useAuth();

  const [liked, setLiked] = useState(Boolean(story?.likedByUser));
  const [likeCount, setLikeCount] = useState(story?.stats?.likes || 0);
  const [recentLikers, setRecentLikers] = useState(story?.recentLikers || []);

  // The reader loads its story asynchronously, so re-seed whenever a different
  // story lands. Re-renders of the same story leave the state alone, which is
  // what keeps an optimistic like from being undone by a parent re-render.
  useEffect(() => {
    setLiked(Boolean(story?.likedByUser));
    setLikeCount(story?.stats?.likes || 0);
    setRecentLikers(story?.recentLikers || []);
  }, [storyId, story?.likedByUser, story?.stats?.likes]);

  const toggleLike = useCallback(
    async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();

      if (!isAuthenticated) {
        toast("Sign in to like stories");
        navigate("/login");
        return;
      }

      const before = { liked, likeCount, recentLikers };
      const next = !liked;
      const viewerId = viewer?.id || viewer?._id;

      setLiked(next);
      setLikeCount((count) => (next ? count + 1 : count - 1));
      setRecentLikers((list) => {
        const others = (list || []).filter(
          (liker) => String(liker.user) !== String(viewerId),
        );
        return next
          ? [
              { user: viewerId, fullName: viewer?.fullName || "You" },
              ...others,
            ].slice(0, 3)
          : others;
      });

      try {
        const res = await api.post(`/stories/${storyId}/like`);
        const serverLiked = res.data?.data?.liked;
        // Trust the server when it disagrees with the optimistic guess.
        if (serverLiked !== undefined && serverLiked !== next) {
          setLiked(serverLiked);
          setLikeCount((count) => (serverLiked ? count + 1 : count - 1));
        }
      } catch {
        setLiked(before.liked);
        setLikeCount(before.likeCount);
        setRecentLikers(before.recentLikers);
        toast.error("Failed to update like");
      }
    },
    [
      isAuthenticated,
      liked,
      likeCount,
      recentLikers,
      navigate,
      storyId,
      viewer,
    ],
  );

  const shareStory = useCallback(
    async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();

      const shared = await share({
        title: storyTitle,
        text: `📖 ${storyTitle}\n\nRead this story on Lifebookz.`,
        url: `/feed/story/${storySlug}`,
      });

      toast.success(shared ? "Shared successfully!" : "Link copied to clipboard");
    },
    [storyTitle, storySlug],
  );

  return { liked, likeCount, recentLikers, toggleLike, shareStory };
}
