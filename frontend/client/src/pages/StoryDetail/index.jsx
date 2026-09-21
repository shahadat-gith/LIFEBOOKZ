import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import { sortChapters } from "../../utils/chapters";
import { isVerifiedAuthor } from "../../utils/authors";

import CommentSection from "./components/CommentSection";
import StoryDetailSkeleton from "./components/StoryDetailSkeleton";
import ChapterCard from "./components/ChapterCard";
import StoryActions from "./components/StoryActions";
import StoryNotFound from "./components/StoryNotFound";

/**
 * A lifebook, read top to bottom: its title, its author, every chapter in
 * order, then the actions and the comments.
 *
 * The page owns the reading state (the optimistic like, the comment anchor);
 * every block below the title is its own component.
 */
export default function StoryDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [recentLikers, setRecentLikers] = useState([]);
  const [commentTrigger, setCommentTrigger] = useState(0);

  const commentSectionRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");

    api
      .get(`/stories/${slug}`)
      .then((res) => {
        const data = res.data.data;
        setStory(data);
        setLiked(data.likedByUser || false);
        setLikeCount(data.stats?.likes || 0);
        setRecentLikers(data.recentLikers || []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error?.message || "Story not found",
        );
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleLike() {
    if (!isAuthenticated) {
      toast("Sign in to like stories");
      navigate("/login");
      return;
    }

    const next = !liked;
    const currentUserId = user?.id || user?._id;

    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    setRecentLikers((prev) => {
      const list = prev || [];
      if (next) {
        const filtered = list.filter(
          (l) => String(l.user) !== String(currentUserId),
        );
        return [{ fullName: user?.fullName || "You" }, ...filtered].slice(0, 3);
      }
      return list.filter((l) => String(l.user) !== String(currentUserId));
    });

    try {
      const res = await api.post(`/stories/${story._id}/like`);
      if (res.data?.data?.liked !== undefined && res.data.data.liked !== next) {
        setLiked(res.data.data.liked);
        setLikeCount((c) => (res.data.data.liked ? c + 1 : c - 1));
      }
    } catch {
      setLiked(liked);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
      setRecentLikers(story.recentLikers || []);
      toast.error("Failed to update like");
    }
  }

  function handleCommentClick() {
    setCommentTrigger((c) => c + 1);
    setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: story?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }

  if (loading) return <StoryDetailSkeleton />;
  if (error || !story) return <StoryNotFound message={error} />;

  const author = story.author || {};
  const sortedChapters = sortChapters(story.chapters);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto py-8 px-4 sm:px-6"
    >
      <Link
        to="/feed"
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icons.chevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Feed
      </Link>

      <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        {story.title || "Untitled Story"}
      </h1>

      {/* Byline — the author's page takes over from here, follow included */}
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <span>By</span>
        <Link
          to={`/authors/${author._id}`}
          className="inline-flex items-center gap-1 font-semibold text-foreground transition-colors hover:text-primary hover:underline"
        >
          {author.fullName || "Anonymous Author"}
          {isVerifiedAuthor(author) && (
            <Icons.verified
              aria-label="Verified author"
              title="Verified author"
              className="h-4 w-4 shrink-0 text-info"
            />
          )}
        </Link>
      </p>

      {/* Every chapter of the lifebook, in order, one after another */}
      {sortedChapters.length === 0 ? (
        <p className="mt-8 text-sm italic text-muted-foreground">
          This story has no chapters yet.
        </p>
      ) : (
        sortedChapters.map((chapter, index) => (
          <ChapterCard key={chapter._id || index} chapter={chapter} />
        ))
      )}

      <StoryActions
        liked={liked}
        likeCount={likeCount}
        commentCount={story.stats?.comments || 0}
        shareCount={story.stats?.shares || 0}
        recentLikers={recentLikers}
        onLike={handleLike}
        onComment={handleCommentClick}
        onShare={handleShare}
      />

      <div
        ref={commentSectionRef}
        className="mt-8 border-t border-border/40 pt-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-foreground">Comments</h3>
        <CommentSection storyId={story._id} commentTrigger={commentTrigger} />
      </div>
    </motion.div>
  );
}
