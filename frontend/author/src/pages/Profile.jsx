import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../icons";
import toast from "react-hot-toast";
import * as storyApi from "../utils/client";

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

/* ---------- Page ---------- */

export default function AuthorProfilePage() {
  const { author } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [stories, setStories] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("lifebook");

  const loadData = useCallback(() => {
    if (!author) return;
    storyApi.getMyStories().then(setStories).catch(() => {});
    storyApi
      .getMyStats?.()
      .then(setStats)
      .catch(() => {});
  }, [author]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (!author) {
    navigate("/login");
    return null;
  }

  /* ---------- Derived data ---------- */

  const chapterRows = stories
    .flatMap((book) =>
      [...(book.chapters || [])]
        .sort((a, b) => a.order - b.order)
        .map((ch) => ({ ...ch, book })),
    )
    .map((ch, i) => ({
      ...ch,
      storyCount: ch.stories?.length || 0,
      tint: CHAPTER_TINTS[i % CHAPTER_TINTS.length],
      numColor: CHAPTER_NUM_COLORS[i % CHAPTER_NUM_COLORS.length],
      cover:
        ch.coverImage?.url ||
        ch.media?.find((m) => m.type === "image")?.url ||
        ch.stories?.find((s) => s.media?.some((m) => m.type === "image"))?.media.find(
          (m) => m.type === "image",
        )?.url,
    }));

  const statRow = [
    { value: stats?.followers ?? author.stats?.followers ?? 0, label: "Followers" },
    { value: stats?.following ?? 0, label: "Following" },
    { value: stats?.chapters ?? chapterRows.length, label: "Chapters" },
    {
      value: stats?.stories ?? chapterRows.reduce((s, c) => s + c.storyCount, 0),
      label: "Stories",
    },
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
  async function handleChapterVisibility(bookId, chapterId, visibility) {
    // Optimistic update
    setStories((prev) =>
      prev.map((b) =>
        (b.id || b._id) !== bookId
          ? b
          : {
              ...b,
              chapters: (b.chapters || []).map((ch) =>
                (ch._id || ch.id) === chapterId ? { ...ch, visibility } : ch,
              ),
            },
      ),
    );
    try {
      await storyApi.updateChapter(bookId, chapterId, { visibility });
      toast.success(
        visibility === "public"
          ? "Chapter is now visible to everyone"
          : visibility === "followers"
            ? "Chapter is now visible to followers only"
            : "Chapter is now private — only you can see it",
      );
    } catch {
      toast.error("Failed to update chapter visibility");
      loadData(); // revert on failure
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
        <StatsRow stats={statRow} />
      </div>

      {/* ═══════════ Tabs ═══════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <ProfileTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ═══════════ Tab content ═══════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {activeTab === "lifebook" && (
          <LifebookTab
            chapterRows={chapterRows}
            onAddChapter={() => navigate("/stories/new")}
            onEditStory={(bookId, storyId) =>
              navigate(`/stories/${bookId}/edit?story=${storyId}`)
            }
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
          <LikesTab total={stats?.likes ?? 0} empty={renderEmpty} />
        )}
        {activeTab === "activity" && (
          <ActivityTab chapterRows={chapterRows} empty={renderEmpty} />
        )}
      </div>
    </motion.div>
  );
}
