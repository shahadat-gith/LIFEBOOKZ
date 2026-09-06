import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "../../icons";

/** Placeholder notifications until the backend endpoint exists */
const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    type: "like",
    actor: "Ananya Sharma",
    text: "liked your story “Starting Over”",
    time: "2 minutes ago",
    unread: true,
  },
  {
    id: 2,
    type: "follow",
    actor: "Kabir Singh",
    text: "started following you",
    time: "26 minutes ago",
    unread: true,
  },
  {
    id: 3,
    type: "comment",
    actor: "Neha Iyer",
    text: "commented on your story: “This moved me deeply.”",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 4,
    type: "share",
    actor: "Rohan Mehta",
    text: "shared your story with 214 readers",
    time: "3 hours ago",
    unread: false,
  },
  {
    id: 5,
    type: "system",
    actor: "Lifebookz",
    text: "Congrats! Your chapter crossed 1,000 readers.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 6,
    type: "like",
    actor: "Meera Kapoor",
    text: "and 12 others liked your story “First Job”",
    time: "2 days ago",
    unread: false,
  },
];

const TYPE_STYLES = {
  like: { icon: Icons.heartSolid, chip: "bg-rose-500/10 text-rose-500" },
  follow: { icon: Icons.userCheck, chip: "bg-blue-500/10 text-blue-500" },
  comment: { icon: Icons.chat, chip: "bg-emerald-500/10 text-emerald-600" },
  share: { icon: Icons.share, chip: "bg-sky-500/10 text-sky-600" },
  system: { icon: Icons.sparkles, chip: "bg-amber-400/15 text-amber-500" },
};

export default function NotificationsDrawer({ open, onClose }) {
  const [items, setItems] = useState(DUMMY_NOTIFICATIONS);
  const unreadCount = items.filter((n) => n.unread).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function markRead(id) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
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
                {unreadCount > 0 && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Mark all read
                  </button>
                )}
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
              {items.map((n) => {
                const style = TYPE_STYLES[n.type] || TYPE_STYLES.system;
                const Icon = style.icon;

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={`flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-muted/40 ${
                      n.unread ? "bg-accent/[0.03]" : ""
                    }`}
                  >
                    {/* Icon chip */}
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.chip}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    {/* Content */}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] leading-snug text-foreground">
                        <span className="font-bold">{n.actor}</span>{" "}
                        <span className="text-muted-foreground">{n.text}</span>
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-muted-foreground/80">
                        {n.time}
                      </span>
                    </span>

                    {n.unread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
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
