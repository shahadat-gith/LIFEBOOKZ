import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/api";

import { useAuth } from "../context/AuthContext";
import * as storyClient from "../utils/client";

import Avatar from "../components/ui/Avatar";
import LoadingScreen from "../components/common/LoadingScreen";
import { Icons } from "../icons";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────── */

function greetingFor(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ProgressRing({ percent }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-primary/10" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-accent transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-foreground">{percent}%</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */

export default function HomePage() {
  const navigate = useNavigate();
  const { author, isLoading: authLoading } = useAuth();

  const [myBooks, setMyBooks] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !author) {
      navigate("/login", { replace: true });
    }
  }, [author, authLoading, navigate]);

  useEffect(() => {
    if (!author) return;

    async function load() {
      try {
        const [mine, community] = await Promise.all([
          storyClient.getMyStories(),
          api.get("/stories", { params: { type: "latest", limit: 10 } }).catch(() => null),
        ]);

        setMyBooks(mine || []);
        setFeed(
          (community?.data?.data?.stories || []).filter(
            (s) => String(s.author?._id) !== String(author.id || author._id),
          ),
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [author]);

  const stats = useMemo(() => {
    const chapters = myBooks.reduce(
      (sum, b) => sum + (b.chapters?.length || 0),
      0,
    );
    const stories = myBooks.reduce(
      (sum, b) =>
        sum +
        (b.chapters || []).reduce((s, ch) => s + (ch.stories?.length || 0), 0),
      0,
    );
    const drafts = myBooks.filter((b) => b.status !== "published").length;
    const percent = Math.min(100, Math.round((stories / 10) * 100));
    return { chapters, stories, drafts, percent };
  }, [myBooks]);

  if (authLoading || loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!author) return null;

  const hasContent = stats.chapters > 0 || stats.stories > 0;

  async function handleDeleteDraft(e, book) {
    e.stopPropagation();
    if (book.status === "published") {
      toast.error("Unpublish the lifebook first to delete it.");
      return;
    }
    if (!window.confirm(`Delete draft "${book.title || "Untitled"}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(book.id || book._id);
    try {
      await storyClient.remove(book.id || book._id);
      setMyBooks((prev) => prev.filter((b) => (b.id || b._id) !== (book.id || book._id)));
      toast.success("Draft deleted");
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  }

  const quickActions = [
    {
      label: "Write Story",
      icon: Icons.edit,
      tint: "bg-blue-50 text-info",
      onClick: () => navigate("/stories/new"),
    },
    {
      label: "Add Memories",
      icon: Icons.camera,
      tint: "bg-green-50 text-success",
      onClick: () => navigate("/my-lifebook"),
    },
    {
      label: "Create Chapter",
      icon: Icons.book,
      tint: "bg-rose-50 text-accent",
      onClick: () => navigate("/stories/new"),
    },
    {
      label: "Read Stories",
      icon: Icons.search,
      tint: "bg-emerald-50 text-success",
      onClick: () => navigate("/discover"),
    },
    {
      label: "My Profile",
      icon: Icons.user,
      tint: "bg-pink-50 text-accent",
      onClick: () => navigate("/profile"),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 pb-28 md:pb-12">
      {/* ═══════════ Greeting ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          {greetingFor(new Date().getHours())}, {author.fullName?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Every life has a story.
          <br className="hidden sm:block" />
          What will you remember today?
        </p>
      </motion.div>

      {/* ═══════════ Lifebook progress card ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8"
      >
        <span className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex-shrink-0 shadow-sm">
          <Icons.book className="h-6 w-6" />
        </span>

        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
            {hasContent ? "Your Lifebook is growing" : "Your Lifebook is waiting"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasContent
              ? `${stats.stories} ${stats.stories === 1 ? "story" : "stories"} across ${stats.chapters} ${stats.chapters === 1 ? "chapter" : "chapters"} so far.`
              : "You haven't written your story yet. Let's start with your first chapter."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/stories/new")}
            className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-sm hover:brightness-110 transition-all"
          >
            <Icons.plus className="h-4 w-4" />
            {hasContent ? "Write a New Story" : "Start Your Lifebook"}
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 self-center sm:self-auto">
          <ProgressRing percent={stats.percent} />
          <span className="text-xs text-muted-foreground">Story Progress</span>
        </div>
      </motion.div>

      {/* ═══════════ Quick actions ═══════════ */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-10">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border/60 px-2 py-4 transition-all"
            >
              <span className={`flex items-center justify-center w-11 h-11 rounded-xl ${a.tint}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center leading-tight">
                {a.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══════════ My drafts (with delete) ═══════════ */}
      {myBooks.filter((b) => b.status !== "published").length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-foreground">
              Your Drafts
            </h2>
          </div>
          <div className="space-y-2.5">
            {myBooks
              .filter((b) => b.status !== "published")
              .map((book) => (
                <div
                  key={book.id || book._id}
                  className="group flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-xs"
                >
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={() => navigate(`/stories/${book.id || book._id}/edit`)}
                  >
                    <p className="font-semibold text-foreground truncate">
                      {book.title || "Untitled Lifebook"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(book.chapters || []).length}{" "}
                      {(book.chapters || []).length === 1 ? "chapter" : "chapters"} ·
                      updated{" "}
                      {new Date(book.updatedAt || book.createdAt).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteDraft(e, book)}
                    disabled={deletingId === (book.id || book._id)}
                    aria-label="Delete draft"
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                  >
                    <Icons.trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ═══════════ Stories For You (other authors only) ═══════════ */}
      <div className="mb-10">
        <div className="flex items-end justify-between mb-1.5">
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
            Stories For You
          </h2>
          <Link
            to="/discover"
            className="text-sm font-semibold text-primary hover:text-accent transition-colors"
          >
            View all
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Experiences, lessons and journeys from other authors.
        </p>

        {feed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Icons.book className="h-9 w-9 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No stories from other authors yet — check back soon.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 snap-x">
            {feed.map((s, i) => {
              const a = s.author || {};
              const firstChapter = [...(s.chapters || [])].sort(
                (x, y) => (x.order ?? 0) - (y.order ?? 0),
              )[0];
              const cover =
                s.coverImage?.url ||
                firstChapter?.coverImage?.url ||
                firstChapter?.media?.find((m) => m.type === "image")?.url ||
                firstChapter?.stories?.find((st) =>
                  st.media?.some((m) => m.type === "image"),
                )?.media.find((m) => m.type === "image")?.url;

              return (
                <motion.div
                  key={s._id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="flex-shrink-0 w-64 sm:w-72 snap-start rounded-2xl border border-border/60 bg-card shadow-xs hover:shadow-md overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
                  onClick={() => navigate(`/feed/story/${s.slug}`)}
                >
                  {/* Cover with bookmark */}
                  <div className="relative h-36 bg-muted">
                    {cover ? (
                      <img src={cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icons.book className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                    )}
                    <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-card/90 flex items-center justify-center text-muted-foreground">
                      <Icons.tag className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Author row */}
                    <div className="flex items-center gap-2.5">
                      <Avatar src={a.avatar?.url} name={a.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate flex items-center gap-1">
                          {a.fullName}
                          {a.verification?.status === "approved" && (
                            <Icons.verified className="h-3.5 w-3.5 text-info flex-shrink-0" />
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Chapter: {firstChapter?.title || "Life"}
                        </p>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mt-3 font-display text-base font-bold text-foreground leading-snug line-clamp-2">
                      {s.title}
                    </h3>
                    {s.summary && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {s.summary}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="mt-3 flex items-center gap-5 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Icons.heartRegular className="h-4 w-4 text-accent" />
                        {s.stats?.likes || 0}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Icons.chat className="h-4 w-4" />
                        {s.stats?.comments || 0}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs ml-auto">
                        <Icons.share className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════ Why write + Not sure where to start ═══════════ */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50/60 border border-green-100 p-6">
          <h3 className="font-display text-lg font-bold text-foreground">
            Why write your story?
          </h3>
          <ul className="mt-4 space-y-2.5">
            {[
              "It's worth remembering.",
              "It can help someone.",
              "It can inspire generations.",
              "It's never too late to begin.",
            ].map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm text-foreground/90">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                  <Icons.check className="h-3 w-3 text-success" />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Link
            to="/stories/new"
            className="mt-5 inline-flex rounded-xl border border-success/40 bg-card px-5 py-2 text-sm font-bold text-success hover:bg-success/5 transition-colors"
          >
            Learn More
          </Link>
        </div>

        {/* Writing Tips & Inspiration — author-focused guidance */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50/60 border border-rose-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-foreground">
              Writing Tips &amp; Inspiration
            </h3>
            <Link
              to="/stories/new"
              className="text-sm font-semibold text-accent hover:underline"
            >
              Start now
            </Link>
          </div>

          <ul className="mt-4 space-y-3">
            {[
              "Start with the moment you remember most vividly.",
              "Write like you're telling it to a friend — not an audience.",
              "Small, ordinary details make memories feel real.",
              "Don't edit while writing. First remember, then refine.",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center">
                  <Icons.check className="h-3 w-3 text-accent" />
                </span>
                {tip}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => navigate("/stories/new")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold shadow-sm hover:brightness-110 transition-all"
          >
            <Icons.edit className="h-4 w-4" />
            Write with a Prompt
          </button>

          {/* Decorative accent */}
          <Icons.sparkles className="absolute -bottom-3 -right-3 h-24 w-24 text-rose-200/60 rotate-12 pointer-events-none" />
        </div>
      </div>

      {/* ═══════════ Not sure where to start (full width) ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex-shrink-0 shadow-sm">
          <Icons.edit className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-foreground">
            Not sure where to start?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer a few simple questions and we'll help you begin your Lifebook.
          </p>
        </div>
        <Link
          to="/stories/new"
          className="flex-shrink-0 inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary px-6 py-3 text-sm font-bold hover:bg-primary/20 transition-colors"
        >
          Help Me Start
        </Link>
      </motion.div>
    </div>
  );
}
