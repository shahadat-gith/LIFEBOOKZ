import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../../config/api";
import StoryCard from "../../components/story/StoryCard";
import StoryCardSkeleton from "../Feed/components/StoryCardSkeleton";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import { Icons } from "../../icons";

import AuthorHeader from "./components/AuthorHeader";
import AuthorSkeleton from "./components/AuthorSkeleton";

/**
 * An author's public profile.
 *
 * The profile and the author's lifebooks are independent reads, so they
 * load in parallel and one failing never blanks the other.
 */
export default function AuthorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [author, setAuthor] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [error, setError] = useState("");

  // The profile and the author's lifebooks are independent reads, so they
  // load in parallel and one failing never blanks the other.
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setStoriesLoading(true);
    setError("");

    api
      .get(`/authors/${id}`)
      .then((res) => setAuthor(res.data.data))
      .catch((err) => {
        setAuthor(null);
        setError(
          err.response?.data?.error?.message ||
            "This author profile could not be located.",
        );
      })
      .finally(() => setLoading(false));

    api
      .get("/stories", { params: { author: id, limit: 20 } })
      .then((res) => setStories(res.data.data.stories || []))
      .catch(() => setStories([]))
      .finally(() => setStoriesLoading(false));
  }, [id]);

  if (loading) return <AuthorSkeleton />;

  if (error || !author) {
    return (
      <ErrorState
        title="Author not found"
        message={error || "This author profile could not be located."}
        onRetry={() => navigate("/feed")}
        retryLabel="Back to feed"
        className="py-20"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-3xl select-none px-4 py-10 sm:px-6"
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="group mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icons.chevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      <AuthorHeader author={author} />

      {/* What they have written */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Lifebooks
        </h2>

        {storiesLoading ? (
          <div className="space-y-5">
            {[1, 2].map((n) => (
              <StoryCardSkeleton key={n} />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <EmptyState
            icon={Icons.book}
            title="No lifebooks yet"
            description="This author hasn't published a lifebook yet."
          />
        ) : (
          <div className="space-y-5">
            {stories.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
