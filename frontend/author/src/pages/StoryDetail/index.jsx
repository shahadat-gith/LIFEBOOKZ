import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { sortChapters } from "../../utils/chapters";
import { Icons } from "../../icons";
import { isVerifiedAuthor } from "../../utils/authors";

import ChapterCard from "./components/ChapterCard";
import StoryActions from "./components/StoryActions";
import CommentSection from "./components/CommentSection";
import StorySkeleton from "./components/StorySkeleton";
import StoryMissing from "./components/StoryMissing";


export default function StoryDetailPage() {
  const { slug } = useParams();
  const { author: viewer } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentTrigger, setCommentTrigger] = useState(0);
  const commentSectionRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");

    api
      .get(`/stories/${slug}`)
      .then((res) => setStory(res.data.data))
      .catch((err) => {
        setError(err.response?.data?.error?.message || "Story not found");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  function scrollToComments() {
    setCommentTrigger((count) => count + 1);
    setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  if (loading) return <StorySkeleton />;
  if (error || !story) return <StoryMissing message={error} />;

  const author = story.author || {};
  const viewerId = viewer?.id || viewer?._id;
  const isOwnStory = Boolean(
    viewerId && author._id && String(viewerId) === String(author._id),
  );

  const sortedChapters = sortChapters(story.chapters);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-5xl px-4 py-8 sm:px-6"
    >
      {/* Back to feed */}
      <Link
        to="/feed"
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icons.chevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Feed
      </Link>

      {/* Title of the lifebook, with its author right underneath */}
      <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        {story.title || "Untitled Story"}
      </h1>

      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <span>By</span>
        <Link
          to={`/authors/${author._id}`}
          className="inline-flex items-center gap-1 font-semibold text-foreground transition-colors hover:text-primary hover:underline"
        >
          {author.fullName || "Anonymous"}
          {isVerifiedAuthor(author) && (
            <Icons.verified
              aria-label="Verified author"
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

      {/* Like · Comment · Share — the same actions readers get */}
      <StoryActions story={story} onComment={scrollToComments} />

      {/* Comments */}
      <div ref={commentSectionRef} className="mt-8 border-t border-border/40 pt-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Comments</h3>
        <CommentSection
          storyId={story._id}
          commentTrigger={commentTrigger}
          canReply={isOwnStory}
        />
      </div>
    </motion.div>
  );
}
