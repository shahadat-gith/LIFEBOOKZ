import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/api";
import Avatar from "../components/ui/Avatar";
import CommentSection from "../components/story/CommentSection";
import FollowAuthorButton from "../components/story/FollowAuthorButton";
import RichText from "../components/common/RichText";
import { Icons } from "../icons";

/**
 * Author-portal story reader — the target of notification links and
 * Feed story cards. Authors read other authors' lifebooks here, like
 * comments and reply to comments on their own stories.
 */
export default function StoryDetail() {
  const { slug } = useParams();

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
      .then((res) => {
        setStory(res.data.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error?.message || "Story not found",
        );
      })
      .finally(() => setLoading(false));
  }, [slug]);

  function handleCommentClick() {
    setCommentTrigger((c) => c + 1);
    setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted/70" />
        <div className="mt-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-muted/60" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icons.exclamationCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Story Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          {error || "This story doesn't exist or has been removed."}
        </p>
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Icons.chevronLeft className="h-4 w-4" />
          Back to Feed
        </Link>
      </div>
    );
  }

  const author = story.author || {};
  const authorName = author.fullName || "Anonymous";
  const isVerified = author.verification?.status === "approved";
  const isOwnStory =
    author._id && String(author._id) === String(story.currentAuthorId);

  const chapters = story.chapters || [];
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-8 px-4 sm:px-6"
    >
      {/* Back Link */}
      <Link
        to="/feed"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <Icons.chevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Feed
      </Link>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-display leading-tight">
          {story.title || "Untitled Story"}
        </h1>

        {/* Cover */}
        {story.coverImage?.url && (
          <div className="mt-6 -mx-4 sm:-mx-6">
            <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-none sm:rounded-2xl">
              <img
                src={story.coverImage.url}
                alt={story.title || "Story cover"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
            </div>
          </div>
        )}

        {/* Author row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pb-6 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Avatar
              src={author.avatar?.url}
              name={authorName}
              size="md"
              className="ring-2 ring-border/60"
            />
            <div>
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <span className="truncate">{authorName}</span>
                {isVerified && (
                  <Icons.verified
                    aria-label="Verified author"
                    className="h-4 w-4 shrink-0 text-info"
                  />
                )}
              </div>
              {author.profession && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {author.profession}
                </div>
              )}
            </div>
          </div>

          {!isOwnStory && author._id && (
            <FollowAuthorButton authorId={author._id} size="sm" />
          )}
        </div>
      </motion.div>

      {/* Chapters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 space-y-12"
      >
        {sortedChapters.length === 0 ? (
          <p className="text-muted-foreground italic">
            This story has no chapters yet.
          </p>
        ) : (
          sortedChapters.map((chapter, idx) => (
            <div key={chapter._id || idx} id={`chapter-${idx}`} className="scroll-mt-24">
              {chapter.coverImage?.url && (
                <div className="mb-6 -mx-4 sm:-mx-6">
                  <div className="relative w-full h-48 sm:h-64 overflow-hidden rounded-none sm:rounded-xl">
                    <img
                      src={chapter.coverImage.url}
                      alt={chapter.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {sortedChapters.length > 1 && (
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-display mb-2">
                  {chapter.title || `Chapter ${idx + 1}`}
                </h2>
              )}

              {chapter.description && !chapter.coverImage?.url && (
                <p className="text-sm text-muted-foreground italic mb-4">
                  {chapter.description}
                </p>
              )}

              {chapter.media?.length > 0 && (
                <ChapterMedia media={chapter.media} />
              )}

              <div className="space-y-8 mt-6">
                {(chapter.stories || []).map((entry, sIdx) => (
                  <article
                    key={entry._id || sIdx}
                    className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {entry.storyType && (
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                          {entry.storyType}
                        </span>
                      )}
                      {entry.dateLabel && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Icons.clock className="h-3 w-3" />
                          {entry.dateLabel}
                        </span>
                      )}
                      {entry.location && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Icons.globe className="h-3 w-3" />
                          {entry.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-semibold text-foreground font-display mb-3">
                      {entry.title}
                    </h3>

                    <RichText
                      content={entry.content}
                      className="text-[15px] leading-relaxed text-foreground/90"
                    />

                    {entry.media?.length > 0 && (
                      <div className="mt-4">
                        <ChapterMedia media={entry.media} small />
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {idx < sortedChapters.length - 1 && (
                <div className="my-12 flex items-center gap-4">
                  <div className="flex-1 h-px bg-border/40" />
                  <Icons.book className="h-3 w-3 text-muted-foreground/50" />
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
            </div>
          ))
        )}
      </motion.div>

      {/* Stats row */}
      <div className="mt-8 py-4 border-t border-border/40">
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Icons.heartRegular className="h-5 w-5" />
            <span>{story.stats?.likes || 0}</span>
          </div>

          <button
            type="button"
            onClick={handleCommentClick}
            className="flex flex-col items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.chat className="h-5 w-5" />
            <span>{story.stats?.comments || 0}</span>
          </button>
        </div>
      </div>

      {/* Comments */}
      <div ref={commentSectionRef} className="mt-8 pt-6 border-t border-border/40">
        <h3 className="text-lg font-semibold text-foreground mb-4">Comments</h3>
        <CommentSection storyId={story._id} commentTrigger={commentTrigger} />
      </div>
    </motion.div>
  );
}

/** Simple media gallery renderer for chapter / story media. */
function ChapterMedia({ media, small = false }) {
  return (
    <div
      className={`grid gap-2 ${
        small ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"
      }`}
    >
      {media.map((m, idx) =>
        m.type === "video" ? (
          <video
            key={idx}
            src={m.url}
            controls
            className={`w-full rounded-xl object-cover bg-black ${small ? "h-24" : "h-40"}`}
          />
        ) : m.type === "audio" ? (
          <audio
            key={idx}
            src={m.url}
            controls
            className="w-full col-span-2 sm:col-span-3"
          />
        ) : (
          <img
            key={idx}
            src={m.url}
            alt={m.caption || "Story media"}
            className={`w-full rounded-xl object-cover ${small ? "h-24" : "h-40"}`}
          />
        ),
      )}
    </div>
  );
}
