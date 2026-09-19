import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import useMyStories from "../hooks/useMyStories";
import useSocialStats from "../hooks/useSocialStats";
import useSettings from "../hooks/useSettings";
import * as storyApi from "../utils/client";
import { Icons } from "../icons";

import ProfileHeader from "../components/profile/ProfileHeader";
import StatsRow from "../components/profile/StatsRow";
import ProfileTabs from "../components/profile/ProfileTabs";
import LifebookTab from "../components/profile/LifebookTab";
import StoriesTab from "../components/profile/StoriesTab";
import MemoriesTab from "../components/profile/MemoriesTab";
import LikesTab from "../components/profile/LikesTab";
import ActivityTab from "../components/profile/ActivityTab";

/* ---------- Constants ---------- */

const TABS = [
  { key: "lifebook", label: "Lifebook", icon: Icons.book },
  { key: "stories", label: "Stories", icon: Icons.document },
  { key: "memories", label: "Memories", icon: Icons.camera },
  { key: "likes", label: "Likes", icon: Icons.heartRegular },
  { key: "activity", label: "Activity", icon: Icons.sparkles },
];

/** Pastel tint per chapter index (matches the mockup's colored cards). */
const CHAPTER_TINTS = [
  "bg-blue-50/70 border-blue-100",
  "bg-green-50/70 border-green-100",
  "bg-rose-50/70 border-rose-100",
  "bg-amber-50/70 border-amber-100",
  "bg-violet-50/70 border-violet-100",
  "bg-cyan-50/70 border-cyan-100",
];

const CHAPTER_NUM_COLORS = [
  "text-info",
  "text-success",
  "text-destructive",
  "text-warning",
  "text-accent",
  "text-info",
];

const chapterId = (ch) => ch._id || ch.id;
const bookId = (b) => b._id || b.id;

/* ---------- Page ---------- */

export default function AuthorProfilePage() {
  const { author } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Everything the page shows is loaded here, on demand — the shell above
  // renders from the session alone.
  const { stories, setStories, loading, error, reload } = useMyStories({
    enabled: Boolean(author),
  });
  const social = useSocialStats({ enabled: Boolean(author) });
  const { settings } = useSettings({ enabled: Boolean(author) });

  const [activeTab, setActiveTab] = useState("lifebook");

  // ?complete=1&redirect=<path> → profile editing lives on its own page now,
  // which also handles the "come back and publish" return trip.
  useEffect(() => {
    if (!searchParams.get("complete")) return;

    const redirect = searchParams.get("redirect");
    navigate(
      `/profile/edit?complete=1${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`,
      { replace: true },
    );
  }, [searchParams, navigate]);

  if (!author) return <Navigate to="/login" replace />;

  /* ---------- Derived data ---------- */

  // Chapters and their stories come from the same loaded lifebooks the tabs
  // render, so the counters can never disagree with the lists below them.
  const chapterRows = useMemo(
    () =>
      stories
        .flatMap((book) =>
          [...(book.chapters || [])]
            .sort((a, b) => a.order - b.order)
            .map((ch) => ({ ...ch, book })),
        )
        .map((ch, i) => {
          const firstImage =
            ch.coverImage?.url ||
            ch.media?.find((m) => m.type === "image")?.url ||
            ch.stories
              ?.find((s) => s.media?.some((m) => m.type === "image"))
              ?.media.find((m) => m.type === "image")?.url;

          return {
            ...ch,
            storyCount: ch.stories?.length || 0,
            tint: CHAPTER_TINTS[i % CHAPTER_TINTS.length],
            numColor: CHAPTER_NUM_COLORS[i % CHAPTER_NUM_COLORS.length],
            cover: firstImage,
          };
        }),
    [stories],
  );

  const storyTotal = chapterRows.reduce((sum, ch) => sum + ch.storyCount, 0);

  const statRow = [
    { value: social.stats?.followers ?? 0, label: "Followers" },
    { value: social.stats?.following ?? 0, label: "Following" },
    { value: chapterRows.length, label: "Chapters" },
    { value: storyTotal, label: "Stories" },
  ];

  const renderEmpty = (Icon, label, hint) => (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="font-display font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground mt-1">{hint}</p>
    </div>
  );

  /* ---------- Actions ---------- */

  /** Change a chapter's visibility (who can read it). */
  async function handleChapterVisibility(book, chapter, visibility) {
    setStories((prev) =>
      prev.map((b) =>
        bookId(b) !== bookId(book)
          ? b
          : {
              ...b,
              chapters: (b.chapters || []).map((ch) =>
                chapterId(ch) === chapterId(chapter) ? { ...ch, visibility } : ch,
              ),
            },
      ),
    );

    try {
      await storyApi.updateChapter(bookId(book), chapterId(chapter), { visibility });
      toast.success(
        visibility === "public"
          ? "Chapter is now visible to everyone"
          : visibility === "followers"
            ? "Chapter is now visible to followers only"
            : "Chapter is now private — only you can see it",
      );
    } catch {
      toast.error("Failed to update chapter visibility");
      reload();
    }
  }

  /**
   * Permanently remove one story from a chapter. Drafts and published stories
   * alike — authors keep full control of their lifebook.
   */
  async function handleDeleteStory(book, chapter, storyEntryId) {
    const previous = stories;
    // Drop it from the list immediately so the count moves with the removal.
    setStories((prev) =>
      prev.map((b) =>
        bookId(b) !== bookId(book)
          ? b
          : {
              ...b,
              chapters: (b.chapters || []).map((ch) =>
                chapterId(ch) === chapterId(chapter)
                  ? {
                      ...ch,
                      stories: (ch.stories || []).filter(
                        (s) => (s._id || s.id) !== storyEntryId,
                      ),
                    }
                  : ch,
              ),
            },
      ),
    );

    try {
      await storyApi.deleteChapterStory(bookId(book), chapterId(chapter), storyEntryId);
      toast.success("Story removed");
    } catch (err) {
      setStories(previous);
      toast.error(err?.response?.data?.error?.message || "Could not remove that story.");
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/authors/${author.id || author._id}`;
    if (navigator.share) {
      navigator.share({ title: author.fullName, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    }
  };

  /* ---------- Render ---------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-24 md:pb-10"
    >
      {/* ═══════════ Cover header ═══════════ */}
      <ProfileHeader
        author={author}
        bio={author.bio}
        onShare={handleShare}
        onEdit={() => navigate("/profile/edit")}
      />

      {/* Directory visibility comes from Settings → Privacy */}
      {settings?.inDirectory === false && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
            <Icons.eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-sm text-muted-foreground">
              Your profile is hidden from the author directory.
            </span>
            <Link
              to="/settings"
              className="text-xs font-semibold text-primary transition-colors hover:underline"
            >
              Change
            </Link>
          </div>
        </div>
      )}

      {/* Prompt for authors who still need to finish their profile */}
      {!author.isProfileCompleted && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <button
            type="button"
            onClick={() => navigate("/profile/edit?complete=1")}
            className="w-full flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-left hover:bg-warning/15 transition-colors"
          >
            <Icons.infoCircle className="h-4 w-4 text-warning flex-shrink-0" />
            <span className="flex-1 text-sm text-foreground">
              Complete your profile to publish stories.
            </span>
            <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* ═══════════ Stats row ═══════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <StatsRow stats={statRow} loading={loading || social.loading} />
      </div>

      {/* ═══════════ Load failure ═══════════ */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <Icons.exclamationCircle className="h-4 w-4 shrink-0 text-destructive" />
            <p className="mr-auto text-xs text-muted-foreground">
              {error?.response?.data?.error?.message ||
                "We couldn't load your lifebook. Please try again."}
            </p>
            <button
              type="button"
              onClick={reload}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ Tabs ═══════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <ProfileTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ═══════════ Tab content ═══════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {loading && chapterRows.length === 0 ? (
          <div className="space-y-3.5" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[92px] animate-pulse rounded-2xl border border-border/60 bg-card"
              />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "lifebook" && (
              <LifebookTab
                chapterRows={chapterRows}
                onAddChapter={() => navigate("/stories/new")}
                onEditStory={(book, storyId) =>
                  navigate(`/stories/${bookId(book)}/edit?story=${storyId}`)
                }
                onDeleteStory={handleDeleteStory}
                onChapterVisibility={handleChapterVisibility}
              />
            )}
            {activeTab === "stories" && (
              <StoriesTab chapterRows={chapterRows} empty={renderEmpty} />
            )}
            {activeTab === "memories" && (
              <MemoriesTab chapterRows={chapterRows} empty={renderEmpty} />
            )}
            {activeTab === "likes" && (
              <LikesTab total={social.stats?.likes ?? 0} empty={renderEmpty} />
            )}
            {activeTab === "activity" && (
              <ActivityTab chapterRows={chapterRows} empty={renderEmpty} />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
