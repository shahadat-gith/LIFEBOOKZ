import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import useMyStories from "../../hooks/useMyStories";
import useSocialStats from "../../hooks/useSocialStats";
import * as storyApi from "../../utils/storyApi";
import { apiErrorMessage, bookId, chapterId, storyEntryId } from "../../utils/helpers";
import { visibilitySavedMessage } from "../../utils/visibility";
import ErrorBanner from "../../components/common/ErrorBanner";
import NoDataState from "../../components/common/NoDataState";
import { Icons } from "../../icons";

import ProfileHeader from "./components/ProfileHeader";
import StatsRow from "./components/StatsRow";
import ProfileTabs from "./components/ProfileTabs";
import LifebookTab from "./components/LifebookTab";
import StoriesTab from "./components/StoriesTab";
import MemoriesTab from "./components/MemoriesTab";
import LikesTab from "./components/LikesTab";
import ActivityTab from "./components/ActivityTab";
import { PROFILE_TABS, chapterRows, profileStats } from "./utils";

/**
 * The author's own profile: their header, their numbers, and their lifebook
 * chapter by chapter.
 *
 * The lifebooks are loaded once here and every tab renders from that, so the
 * counts and the lists can never drift apart. Each edit is optimistic and
 * rolled back if the API rejects it.
 */
export default function ProfilePage() {
  const { author } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { stories, setStories, loading, error, reload } = useMyStories({
    enabled: Boolean(author),
  });
  const social = useSocialStats({ enabled: Boolean(author) });

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

  const rows = useMemo(() => chapterRows(stories), [stories]);
  const stats = useMemo(() => profileStats(rows, social.stats), [rows, social.stats]);

  if (!author) return <Navigate to="/login" replace />;

  /* ---------- Actions ---------- */

  /** Apply a change to one chapter of one lifebook, optimistically. */
  function updateChapterIn(book, chapter, updater) {
    setStories((prev) =>
      prev.map((candidate) =>
        bookId(candidate) !== bookId(book)
          ? candidate
          : {
              ...candidate,
              chapters: (candidate.chapters || []).map((entry) =>
                chapterId(entry) === chapterId(chapter) ? updater(entry) : entry,
              ),
            },
      ),
    );
  }

  /** Rename a chapter — the title is the author's own. */
  async function handleRenameChapter(book, chapter, title) {
    const clean = title.trim();
    if (!clean || clean === chapter.title) return;

    const previous = stories;
    updateChapterIn(book, chapter, (entry) => ({ ...entry, title: clean }));

    try {
      await storyApi.updateChapter(bookId(book), chapterId(chapter), {
        title: clean,
      });
      toast.success("Chapter renamed");
    } catch {
      setStories(previous);
      toast.error("Failed to rename chapter");
    }
  }

  /**
   * Change one story's visibility — visibility is a story's own choice, so
   * each entry in a chapter can be shared with a different audience.
   */
  async function handleStoryVisibility(book, chapter, id, visibility) {
    updateChapterIn(book, chapter, (entry) => ({
      ...entry,
      stories: (entry.stories || []).map((story) =>
        storyEntryId(story) === id ? { ...story, visibility } : story,
      ),
    }));

    try {
      await storyApi.updateChapterStory(bookId(book), chapterId(chapter), id, {
        visibility,
      });
      toast.success(visibilitySavedMessage(visibility));
    } catch {
      toast.error("Failed to update story visibility");
      reload();
    }
  }

  /**
   * Permanently remove one story from a chapter. Drafts and published stories
   * alike — authors keep full control of their lifebook.
   */
  async function handleDeleteStory(book, chapter, id) {
    const previous = stories;
    // Drop it immediately so the count moves with the removal.
    updateChapterIn(book, chapter, (entry) => ({
      ...entry,
      stories: (entry.stories || []).filter(
        (story) => storyEntryId(story) !== id,
      ),
    }));

    try {
      await storyApi.deleteChapterStory(bookId(book), chapterId(chapter), id);
      toast.success("Story removed");
    } catch (err) {
      setStories(previous);
      toast.error(apiErrorMessage(err, "Could not remove that story."));
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/authors/${author.id || author._id}`;
    if (navigator.share) {
      navigator.share({ title: author.fullName, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    }
  }

  /** The empty state each tab shows when it has nothing to list. */
  const renderEmpty = (Icon, label, hint) => (
    <NoDataState variant="panel" icon={Icon} title={label} description={hint} />
  );

  const showSkeleton = loading && rows.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-24 md:pb-10"
    >
      <ProfileHeader
        author={author}
        bio={author.bio}
        onShare={handleShare}
        onEdit={() => navigate("/profile/edit")}
      />

      {/* Prompt for authors who still need to finish their profile */}
      {!author.isProfileCompleted && (
        <div className="mx-auto mt-4 max-w-6xl px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("/profile/edit?complete=1")}
            className="flex w-full items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-left transition-colors hover:bg-warning/15"
          >
            <Icons.infoCircle className="h-4 w-4 flex-shrink-0 text-warning" />
            <span className="flex-1 text-sm text-foreground">
              Complete your profile to publish stories.
            </span>
            <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <StatsRow stats={stats} loading={loading || social.loading} />
      </div>

      {error && (
        <div className="mx-auto mt-4 max-w-6xl px-4 sm:px-6">
          <ErrorBanner
            error={error}
            message={apiErrorMessage(
              error,
              "We couldn't load your lifebook. Please try again.",
            )}
            onRetry={reload}
          />
        </div>
      )}

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <ProfileTabs tabs={PROFILE_TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        {showSkeleton ? (
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
                chapterRows={rows}
                onAddChapter={() => navigate("/stories/new")}
                onEditStory={(book, id) =>
                  navigate(`/stories/${bookId(book)}/edit?story=${id}`)
                }
                onDeleteStory={handleDeleteStory}
                onStoryVisibility={handleStoryVisibility}
                onRenameChapter={handleRenameChapter}
              />
            )}
            {activeTab === "stories" && (
              <StoriesTab chapterRows={rows} empty={renderEmpty} />
            )}
            {activeTab === "memories" && (
              <MemoriesTab chapterRows={rows} empty={renderEmpty} />
            )}
            {activeTab === "likes" && (
              <LikesTab total={social.stats?.likes ?? 0} empty={renderEmpty} />
            )}
            {activeTab === "activity" && (
              <ActivityTab chapterRows={rows} empty={renderEmpty} />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
