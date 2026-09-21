import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import useMyStories from "../../hooks/useMyStories";
import useMyActivity from "../../hooks/useMyActivity";
import * as storyApi from "../../utils/storyApi";
import { apiErrorMessage, bookId, chapterId } from "../../utils/helpers";
import ErrorBanner from "../../components/common/ErrorBanner";
import { Icons } from "../../icons";
import {
  dashboardTotals,
  flattenStories,
  recentLikers as collectLikers,
} from "./utils";

import DashboardStats from "./components/DashboardStats";
import LifebookCard from "./components/LifebookCard";
import StoryList from "./components/StoryList";
import ActivityFeed from "./components/ActivityFeed";
import RecentLikers from "./components/RecentLikers";

/**
 * My Stories — one place for everything the author has written.
 *
 * The lifebooks are the single source of truth: the tiles, the cards and the
 * story list are all derived from the same loaded data, so no two views of the
 * dashboard can disagree. Activity comes from the notification stream, which
 * already resolves each actor from their own account.
 */
export default function StoryDashboardPage() {
  const navigate = useNavigate();
  const { author } = useAuth();
  const authorId = author?.id || author?._id || null;

  const { stories: books, setStories, loading, error, reload } = useMyStories({
    enabled: Boolean(authorId),
  });
  const activity = useMyActivity({ enabled: Boolean(authorId) });

  const [removingId, setRemovingId] = useState(null);

  const rows = useMemo(() => flattenStories(books), [books]);
  const totals = useMemo(() => dashboardTotals(books), [books]);
  const likers = useMemo(() => collectLikers(books), [books]);

  const openEdit = (book, entryId) =>
    navigate(
      `/stories/${bookId(book)}/edit${entryId ? `?story=${entryId}` : ""}`,
    );

  const openStory = (book) => navigate(`/feed/story/${book.slug}`);

  function handleActivityOpen(notification) {
    if (!notification.read) activity.markRead(notification.id);
    if (notification.link?.startsWith("/")) navigate(notification.link);
  }

  /** Remove one story from its chapter — drafts and published alike. */
  async function handleRemove(row) {
    const title = row.story.title || "Untitled";
    if (!window.confirm(`Remove “${title}”? This cannot be undone.`)) return;

    const previous = books;
    setRemovingId(row.id);

    // Drop it immediately so the tiles and lists move together.
    setStories((prev) =>
      prev.map((book) =>
        bookId(book) !== bookId(row.book)
          ? book
          : {
              ...book,
              chapters: (book.chapters || []).map((chapter) =>
                chapterId(chapter) !== chapterId(row.chapter)
                  ? chapter
                  : {
                      ...chapter,
                      stories: (chapter.stories || []).filter(
                        (s) => (s._id || s.id) !== row.id,
                      ),
                    },
              ),
            },
      ),
    );

    try {
      await storyApi.deleteChapterStory(
        bookId(row.book),
        chapterId(row.chapter),
        row.id,
      );
      toast.success("Story removed");
    } catch (err) {
      setStories(previous);
      toast.error(
        err?.response?.data?.error?.message || "Could not remove that story.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 md:py-8 md:pb-12"
    >
      {/* ═══════════ Header ═══════════ */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Stories
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you have written, and what readers are doing with it.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/stories/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
        >
          <Icons.plus className="h-4 w-4" />
          New story
        </button>
      </header>

      {/* ═══════════ Headline numbers ═══════════ */}
      <DashboardStats totals={totals} loading={loading} />

      {/* ═══════════ Load failure ═══════════ */}
      {error && (
        <ErrorBanner
          className="mt-4"
          error={error}
          message={apiErrorMessage(error, "We couldn't load your stories.")}
          onRetry={reload}
        />
      )}

      {/* ═══════════ Your lifebooks ═══════════ */}
      {books.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-base font-bold text-foreground">
            Your lifebooks
          </h2>
          <div className="space-y-3.5">
            {books.map((book) => (
              <LifebookCard
                key={bookId(book)}
                book={book}
                onEdit={(b) => openEdit(b)}
                onView={openStory}
              />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ Stories + activity ═══════════ */}
      {/* min-w-0 on both columns: grid items refuse to shrink below their
          content's intrinsic width otherwise, which overflows on phones. */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <StoryList
            rows={rows}
            loading={loading}
            removingId={removingId}
            onEdit={(row) => openEdit(row.book, row.id)}
            onView={(row) => row.book?.slug && openStory(row.book)}
            onRemove={handleRemove}
          />
        </div>

        <aside className="min-w-0 space-y-5">
          <ActivityFeed
            items={activity.items}
            loading={activity.loading}
            error={activity.error}
            onRetry={activity.reload}
            onOpen={handleActivityOpen}
          />
          <RecentLikers likers={likers} />
        </aside>
      </div>
    </motion.div>
  );
}
