import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import api from "../config/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import CommentSection from "../components/story/CommentSection";
import FollowAuthorButton from "../components/story/FollowAuthorButton";
import RichText from "../components/common/RichText";
import { Icons } from "../icons";
import { formatLikesCaption } from "../utils/helpers";
import { share } from "../utils/share";

/**
 * Author-portal story reader — the target of notification links and
 * Feed story cards. Authors read other authors' lifebooks here, like
 * comments and reply to comments on their own stories.
 */
export default function StoryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { author: viewer, isAuthenticated } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentTrigger, setCommentTrigger] = useState(0);
  // Reading actions work here exactly as they do in the client portal.
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [recentLikers, setRecentLikers] = useState([]);
  // One chapter is read at a time; a freshly opened story starts at chapter 1.
  const [activeChapter, setActiveChapter] = useState(0);
  const commentSectionRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");
    setActiveChapter(0);

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
    const viewerId = viewer?.id || viewer?._id;

    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    setRecentLikers((prev) => {
      const list = prev || [];
      const withoutMe = list.filter((l) => String(l.user) !== String(viewerId));
      return next
        ? [{ user: viewerId, fullName: viewer?.fullName || "You" }, ...withoutMe].slice(0, 3)
        : withoutMe;
    });

    try {
      const res = await api.post(`/stories/${story._id}/like`);
      const serverLiked = res.data?.data?.liked;
      if (serverLiked !== undefined && serverLiked !== next) {
        setLiked(serverLiked);
        setLikeCount((c) => (serverLiked ? c + 1 : c - 1));
      }
    } catch {
      setLiked(liked);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
      setRecentLikers(story.recentLikers || []);
      toast.error("Failed to update like");
    }
  }

  async function handleShare() {
    const shared = await share({
      title: story.title,
      text: `📖 ${story.title}\n\nRead this story on Lifebookz.`,
      url: `/feed/story/${story.slug || story._id}`,
    });

    toast.success(shared ? "Shared successfully!" : "Link copied to clipboard");
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
  // The viewer owns the story when the author ids match. (The API sends no
  // ownership flag, so it is derived from the signed-in author.)
  const viewerId = viewer?.id || viewer?._id;
  const isOwnStory = Boolean(
    viewerId && author._id && String(viewerId) === String(author._id),
  );

  const chapters = story.chapters || [];
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const currentChapter = sortedChapters[activeChapter] || sortedChapters[0];
  const likesCaption = formatLikesCaption(recentLikers, likeCount);

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

      {/* Chapters — one at a time, chosen from the list of chapters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        {sortedChapters.length === 0 ? (
          <p className="text-muted-foreground italic">
            This story has no chapters yet.
          </p>
        ) : (
          <>
            {sortedChapters.length > 1 && (
              <ChapterPicker
                chapters={sortedChapters}
                active={activeChapter}
                onChange={setActiveChapter}
              />
            )}

            <ChapterBody
              chapter={currentChapter}
              index={sortedChapters.indexOf(currentChapter)}
            />
          </>
        )}
      </motion.div>

      {/* Like · Comment · Share — the same actions readers get */}
      <div className="mt-8 py-4 border-t border-border/40">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike this story" : "Like this story"}
            className={`flex flex-col items-center gap-1 text-xs font-semibold transition-colors select-none ${
              liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
            }`}
          >
            {liked ? (
              <Icons.heartSolid className="h-5 w-5" />
            ) : (
              <Icons.heartRegular className="h-5 w-5" />
            )}
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={handleCommentClick}
            className="flex flex-col items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.chat className="h-5 w-5" />
            <span>{story.stats?.comments || 0}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share this story"
            className="flex flex-col items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.share className="h-5 w-5" />
            <span>{story.stats?.shares || 0}</span>
          </button>
        </div>

        {likesCaption && (
          <p className="mt-3 text-xs text-muted-foreground">{likesCaption}</p>
        )}
      </div>

      {/* Comments */}
      <div ref={commentSectionRef} className="mt-8 pt-6 border-t border-border/40">
        <h3 className="text-lg font-semibold text-foreground mb-4">Comments</h3>
        <CommentSection
          storyId={story._id}
          commentTrigger={commentTrigger}
          canReply={isOwnStory}
        />
      </div>
    </motion.div>
  );
}

/**
 * The picture that represents a chapter: its own cover if it has one,
 * otherwise the first photo in the chapter, otherwise the first photo in one
 * of its stories.
 */
function chapterLeadImage(chapter) {
  if (chapter.coverImage?.url) return { url: chapter.coverImage.url, from: "cover" };

  const chapterPhoto = (chapter.media || []).find((m) => m.type === "image");
  if (chapterPhoto) return { url: chapterPhoto.url, from: "media" };

  for (const entry of chapter.stories || []) {
    const photo = (entry.media || []).find((m) => m.type === "image");
    if (photo) return { url: photo.url, from: "story" };
  }

  return null;
}

/**
 * Chapter list. The reader is shown one chapter at a time, so this is how
 * they move between them — and it always starts on chapter 1.
 */
function ChapterPicker({ chapters, active, onChange }) {
  const containerRef = useRef(null);

  function select(index) {
    onChange(index);
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={containerRef} className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Chapters</h3>
        <span className="text-xs text-muted-foreground">
          {chapters.length} chapters
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Chapters"
        className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0"
      >
        {chapters.map((chapter, idx) => {
          const isActive = idx === active;
          return (
            <button
              key={chapter._id || idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(idx)}
              aria-current={isActive ? "true" : undefined}
              className={`flex-shrink-0 snap-start rounded-xl border px-3.5 py-2 text-left transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card text-foreground hover:bg-muted"
              }`}
            >
              <span
                className={`block text-[10px] font-bold uppercase tracking-widest ${
                  isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                Chapter {idx + 1}
              </span>
              <span className="block max-w-[11rem] truncate text-sm font-semibold">
                {chapter.title || "Untitled Chapter"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** One chapter: its header, then the stories written in it. */
function ChapterBody({ chapter, index }) {
  if (!chapter) return null;

  const lead = chapterLeadImage(chapter);
  const stories = chapter.stories || [];

  return (
    <div id={`chapter-${index}`} className="mt-6 scroll-mt-24">
      <ChapterHeader chapter={chapter} index={index} lead={lead} />

      {stories.length === 0 ? (
        <p className="mt-6 text-sm italic text-muted-foreground">
          No stories in this chapter yet.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {stories.map((entry, idx) => (
            <StoryEntry key={entry._id || idx} entry={entry} leadUrl={lead?.url} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One story inside a chapter. The chapter's lead photo is dropped from the
 * story's gallery — it is already the picture at the top of the chapter.
 */
function StoryEntry({ entry, leadUrl }) {
  const media = (entry.media || []).filter((m) => m.url !== leadUrl);

  return (
    <article className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {entry.storyType && (
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
            {entry.storyType}
          </span>
        )}
        {entry.dateLabel && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Icons.clock className="h-3 w-3" />
            {entry.dateLabel}
          </span>
        )}
        {entry.location && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Icons.globe className="h-3 w-3" />
            {entry.location}
          </span>
        )}
      </div>

      <h3 className="mb-3 font-display text-xl font-semibold text-foreground sm:text-2xl">
        {entry.title}
      </h3>

      <RichText
        content={entry.content}
        className="text-[15px] leading-relaxed text-foreground/90"
      />

      {media.length > 0 && (
        <div className="mt-4">
          <ChapterMedia media={media} small />
        </div>
      )}
    </article>
  );
}

/**
 * Chapter header: the chapter's picture sits on top, and below it come the
 * author, the numbered title ("Chapter 1 — Childhood") and what the chapter
 * holds. Numbering is always shown so a chapter reads as a chapter.
 */
function ChapterHeader({ chapter, index, lead = null }) {
  const media = chapter.media || [];
  const stories = chapter.stories || [];

  // When the chapter's picture already came from its gallery, keep that photo
  // out of the gallery below so it isn't shown twice.
  const galleryMedia = lead?.from === "media" ? media.filter((m) => m.url !== lead.url) : media;

  const countMedia = (type) =>
    media.filter((m) => m.type === type).length +
    stories.reduce(
      (total, entry) => total + (entry.media || []).filter((m) => m.type === type).length,
      0,
    );

  const photoCount = countMedia("image");
  const videoCount = countMedia("video");
  const chapterLabel = `Chapter ${index + 1}`;

  return (
    <header>
      {/* Chapter picture */}
      <div className="relative -mx-4 overflow-hidden bg-muted sm:mx-0 sm:rounded-2xl">
        <div className="relative h-52 w-full sm:h-72">
          {lead ? (
            <img
              src={lead.url}
              alt={chapter.title || chapterLabel}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <Icons.book className="h-10 w-10 text-primary/40" />
            </div>
          )}
          {lead && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground backdrop-blur">
            {chapterLabel}
          </span>
        </div>
      </div>

      {/* Numbered title — the author is shown once, at the top of the story */}
      <h2 className="mt-5 font-display text-2xl font-bold text-foreground sm:text-3xl">
        {chapterLabel}
        <span className="text-muted-foreground"> — </span>
        {chapter.title || "Untitled Chapter"}
      </h2>

      {chapter.description && (
        <p className="mt-2 text-sm italic text-muted-foreground">{chapter.description}</p>
      )}

      {/* Details */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Icons.book className="h-3.5 w-3.5" />
          {stories.length} {stories.length === 1 ? "story" : "stories"}
        </span>
        {photoCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Icons.camera className="h-3.5 w-3.5" />
            {photoCount} {photoCount === 1 ? "photo" : "photos"}
          </span>
        )}
        {videoCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Icons.videoCamera className="h-3.5 w-3.5" />
            {videoCount} {videoCount === 1 ? "video" : "videos"}
          </span>
        )}
      </div>

      {galleryMedia.length > 0 && (
        <div className="mt-6">
          <ChapterMedia media={galleryMedia} />
        </div>
      )}
    </header>
  );
}

/**
 * Media gallery for chapter / story media.
 *
 * A lone photo or video is a story's picture, not a thumbnail — it spans
 * the full width of the column. Two or more fall back to a compact grid.
 */
function ChapterMedia({ media, small = false }) {
  const items = media || [];
  if (items.length === 0) return null;

  const [only] = items;
  if (items.length === 1 && only.type !== "audio") {
    return only.type === "video" ? (
      <video
        src={only.url}
        controls
        className="w-full max-h-[28rem] rounded-xl bg-black"
      />
    ) : (
      <img
        src={only.url}
        alt={only.caption || "Story media"}
        className="w-full max-h-[28rem] rounded-xl object-cover"
      />
    );
  }

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
