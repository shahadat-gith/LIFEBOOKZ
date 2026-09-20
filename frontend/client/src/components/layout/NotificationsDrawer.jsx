import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "../../icons";
import Avatar from "../ui/Avatar";
import { useNotifications, timeAgo } from "../../hooks/useNotifications";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";

const TYPE_STYLES = {
  like: { icon: Icons.heartSolid, chip: "bg-rose-500/10 text-rose-500" },
  comment: { icon: Icons.chat, chip: "bg-emerald-500/10 text-emerald-600" },
  follow: { icon: Icons.userAdd, chip: "bg-blue-500/10 text-blue-500" },
  publish: { icon: Icons.book, chip: "bg-sky-500/10 text-sky-600" },
  booking: { icon: Icons.clock, chip: "bg-violet-500/10 text-violet-500" },
  testimonial: {
    icon: Icons.starSolid,
    chip: "bg-amber-400/15 text-amber-500",
  },
  system: { icon: Icons.sparkles, chip: "bg-amber-400/15 text-amber-500" },
};

/**
 * Reader notifications drawer — fully wired to the notifications API.
 */
export default function NotificationsDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    unread,
    items,
    loading,
    loaded,
    hasMore,
    fetchItems,
    markRead,
    markAllRead,
    remove,
  } = useNotifications(api, { enabled: isAuthenticated && open });

  // Snapshot of the unread badge at open time (everything is marked read
  // on open, like Facebook).
  const [badgeAtOpen, setBadgeAtOpen] = useState(0);
  const markedRef = useRef(false);

  useEffect(() => {
    if (open && isAuthenticated) {
      setBadgeAtOpen(unread);
      markedRef.current = false;
      fetchItems().then(() => {
        if (!markedRef.current) {
          markedRef.current = true;
          markAllRead();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAuthenticated]);

  function handleClick(n) {
    if (!n.read) markRead(n.id);
    onClose();
    if (n.link) navigate(n.link);
  }

  function loadMore() {
    const last = items[items.length - 1];
    if (last) fetchItems({ append: true, before: last.id });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-primary/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col bg-card shadow-2xl"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
                  Notifications
                </h2>
                {badgeAtOpen > 0 && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
                    {badgeAtOpen} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close notifications"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icons.close className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 divide-y divide-border/50 overflow-y-auto">
              {loading && !loaded ? (
                <div className="flex flex-col gap-4 p-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted/70" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Icons.bell className="h-6 w-6 text-muted-foreground" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    No notifications yet
                  </p>
                  
                </div>
              ) : (
                <>
                  {items.map((n) => {
                    const style = TYPE_STYLES[n.type] || TYPE_STYLES.system;
                    const Icon = style.icon;
                    const actorName = n.actor?.name || "Lifebookz";

                    return (
                      <div
                        key={n.id}
                        className={`group relative flex w-full items-start gap-3.5 px-5 py-4 transition-colors ${
                          n.read
                            ? "hover:bg-muted/40"
                            : "bg-accent/[0.04] hover:bg-accent/[0.07]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleClick(n)}
                          className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
                        >
                          {n.actor?.avatar?.url ? (
                            <Avatar
                              src={n.actor.avatar.url}
                              name={actorName}
                              size="sm"
                              className="mt-0.5 shrink-0 ring-2 ring-border/50"
                            />
                          ) : (
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.chip}`}
                            >
                              <Icon className="h-[18px] w-[18px]" />
                            </span>
                          )}

                          <span className="min-w-0 flex-1">
                            {n.title && (
                              <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-foreground">
                                {n.title}
                              </span>
                            )}
                            <span className="block text-[15px] leading-snug text-foreground">
                              {!n.title && (
                                <span className="font-bold">{actorName} </span>
                              )}
                              <span className="text-muted-foreground">
                                {n.preview}
                              </span>
                            </span>
                            <span className="mt-1 block text-[11px] font-medium text-muted-foreground/80">
                              {timeAgo(n.createdAt)}
                            </span>
                          </span>

                          {!n.read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => remove(n.id)}
                          aria-label="Delete notification"
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                        >
                          <Icons.close className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <div className="p-3 text-center">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loading}
                        className="rounded-full px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        {loading ? "Loading..." : "Load more"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 px-5 py-3.5 text-center">
              <p className="text-[11px] font-medium text-muted-foreground/70">
                You're all caught up — new activity will appear here.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
