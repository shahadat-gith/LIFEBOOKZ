import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import { Icons } from "../icons";
import toast from "react-hot-toast";
import * as storyApi from "../utils/client";

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
  const { author, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("lifebook");
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState(author?.fullName || "");
  const [profession, setProfession] = useState(author?.profession || "");
  const [bio, setBio] = useState(author?.bio || "");
  const [city, setCity] = useState(author?.address?.city || "");
  const [country, setCountry] = useState(author?.address?.country || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!author) return;
    setFullName(author.fullName || "");
    setProfession(author.profession || "");
    setBio(author.bio || "");
    setCity(author.address?.city || "");
    setCountry(author.address?.country || "");
  }, [author]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith?.("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

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

  // Close share menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!author) {
    navigate("/login");
    return null;
  }

  /* ---------- Derived data ---------- */

  const isApproved = author.verification?.status === "approved";
  const joined = author.createdAt
    ? new Date(author.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "";

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
        ch.stories?.find((s) => s.media?.some((m) => m.type === "image"))?.media
          .find((m) => m.type === "image")?.url,
    }));

  const statRow = [
    { value: stats?.followers ?? author.stats?.followers ?? 0, label: "Followers" },
    { value: stats?.following ?? 0, label: "Following" },
    { value: stats?.chapters ?? chapterRows.length, label: "Chapters" },
    { value: stats?.stories ?? chapterRows.reduce((s, c) => s + c.storyCount, 0), label: "Stories" },
  ];

  /* ---------- Actions ---------- */

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      fd.append("profession", profession);
      fd.append("bio", bio);
      fd.append("address", JSON.stringify({ city, country }));
      if (avatarFile) fd.append("avatar", avatarFile);
      await updateProfile(fd);
      toast.success("Profile updated");
      setEditOpen(false);
      setAvatarFile(null);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
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
      <div className="relative">
        {/* Gradient cover (navy horizon → sky) */}
        <div className="relative h-44 sm:h-64 lg:h-80 overflow-hidden bg-gradient-to-b from-secondary via-[#7d9cc0] to-background">
          {author.coverImage?.url && (
            <img
              src={author.coverImage.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-transparent to-background/90" />

          {/* Top-right actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share profile"
              className="w-9 h-9 rounded-full bg-card/85 backdrop-blur flex items-center justify-center text-foreground shadow-sm hover:bg-card transition-colors"
            >
              <Icons.share className="h-4 w-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="More options"
                className="w-9 h-9 rounded-full bg-card/85 backdrop-blur flex items-center justify-center text-foreground shadow-sm hover:bg-card transition-colors"
              >
                <Icons.menu className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover shadow-md p-1.5 z-20">
                  <button
                    type="button"
                    onClick={() => {
                      setEditOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Icons.edit className="h-4 w-4" /> Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Icons.logout className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Identity block overlapping the cover */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Avatar with double ring + verified dot */}
            <div className="relative flex-shrink-0">
              <div className="rounded-full p-1 bg-card shadow-md inline-block">
                <Avatar
                  src={avatarPreview || author.avatar?.url}
                  name={author.fullName}
                  size="xl"
                  className="w-28 h-28 sm:w-32 sm:h-32 text-3xl ring-4 ring-card"
                />
              </div>
             
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground truncate">
                  {author.fullName}
                </h1>
                <Icons.verified className="h-5 w-5 text-info flex-shrink-0" />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">@{author.username}</span>
                {isApproved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success text-xs font-semibold px-2.5 py-0.5">
                    <Icons.check className="h-3 w-3" />
                    Verified Profile
                  </span>
                )}
              </div>

              {bio && (
                <p className="mt-2 text-sm text-foreground/90 max-w-lg whitespace-pre-line">
                  {bio}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {(city || country) && (
                  <span className="inline-flex items-center gap-1">
                    <Icons.globe className="h-3.5 w-3.5" />
                    {[city, country].filter(Boolean).join(", ")}
                  </span>
                )}
                {joined && (
                  <span className="inline-flex items-center gap-1">
                    <Icons.clock className="h-3.5 w-3.5" />
                    Joined {joined}
                  </span>
                )}
                {profession && (
                  <span className="inline-flex items-center gap-1">
                    <Icons.edit className="h-3.5 w-3.5" />
                    {profession}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ Stats row ═══════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="rounded-2xl bg-card border border-border/60 shadow-xs px-2 py-4 grid grid-cols-4 divide-x divide-border/50">
          {statRow.map((s) => (
            <div key={s.label} className="text-center px-1">
              <p className="font-display text-xl sm:text-2xl font-bold text-foreground">
                {s.value}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ Tabs ═══════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex overflow-x-auto no-scrollbar border-b border-border/60">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-5 sm:px-7 pb-3 pt-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════ Tab content ═══════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {activeTab === "lifebook" && (
          <LifebookTab chapterRows={chapterRows} onAddChapter={() => navigate("/stories/new")} />
        )}
        {activeTab === "stories" && <StoriesTab chapterRows={chapterRows} />}
        {activeTab === "memories" && <MemoriesTab chapterRows={chapterRows} />}
        {activeTab === "likes" && <LikesTab total={stats?.likes ?? 0} />}
        {activeTab === "activity" && <ActivityTab chapterRows={chapterRows} />}
      </div>

      {/* ═══════════ Edit modal ═══════════ */}
      {editOpen && (
        <EditProfileModal
          formState={{
            fullName, setFullName,
            profession, setProfession,
            bio, setBio,
            city, setCity,
            country, setCountry,
          }}
          avatarPreview={avatarPreview}
          avatarRef={avatarRef}
          onAvatarChange={handleAvatarChange}
          saving={saving}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
        />
      )}
    </motion.div>
  );
}

/* ================= Tabs ================= */

function LifebookTab({ chapterRows, onAddChapter }) {
  return (
    <div className="space-y-5">
      {/* My Lifebook heading + View Full Lifebook */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">My Lifebook</h2>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary hover:bg-muted/60 transition-colors"
        >
          View Full Lifebook
          <Icons.chevronRight className="h-4 w-4" />
        </Link>
      </div>

      {chapterRows.length === 0 ? (
        <EmptyChapterState onAddChapter={onAddChapter} />
      ) : (
        <div className="space-y-3.5">
          {chapterRows.map((ch, idx) => (
            <motion.button
              key={ch._id || idx}
              type="button"
              whileTap={{ scale: 0.995 }}
              onClick={onAddChapter}
              className={`w-full flex items-center gap-4 rounded-2xl border p-3 text-left shadow-xs hover:shadow-sm transition-all ${ch.tint}`}
            >
              {ch.cover ? (
                <img
                  src={ch.cover}
                  alt=""
                  className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl bg-card/70 flex items-center justify-center flex-shrink-0">
                  <Icons.book className="h-6 w-6 text-muted-foreground/60" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className={`font-display text-lg font-bold ${ch.numColor}`}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                    {ch.title || "Untitled Chapter"}
                  </h3>
                </div>
                {ch.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                    {ch.description}
                  </p>
                )}
                <p className="text-xs font-semibold text-foreground/80 mt-1">
                  {ch.storyCount} {ch.storyCount === 1 ? "Story" : "Stories"}
                </p>
              </div>

              {/* Count pill */}
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-card/80 border border-border/50 flex items-center justify-center font-display text-sm font-bold text-foreground">
                {ch.storyCount}
              </span>
              <Icons.chevronRight className="h-4 w-4 text-foreground/50 flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Add New Chapter */}
      <button
        type="button"
        onClick={onAddChapter}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-4 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
      >
        <Icons.plus className="h-4 w-4" />
        Add New Chapter
      </button>
    </div>
  );
}

function EmptyChapterState({ onAddChapter }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Icons.book className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="font-display font-semibold text-foreground">Your lifebook is empty</p>
      <p className="text-sm text-muted-foreground mt-1">
        Chapters hold the stories of your life. Create your first one.
      </p>
      <button
        type="button"
        onClick={onAddChapter}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition-all"
      >
        <Icons.plus className="h-4 w-4" /> Create First Chapter
      </button>
    </div>
  );
}

function StoriesTab({ chapterRows }) {
  const rows = chapterRows.flatMap((ch) =>
    (ch.stories || []).map((s) => ({ ...s, chapter: ch })),
  );

  if (rows.length === 0) {
    return <TabEmpty icon={Icons.document} label="No stories yet" hint="Write your first story from the + button." />;
  }

  return (
    <div className="space-y-3">
      {rows.map((s, i) => (
        <div
          key={s._id || i}
          className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {s.storyType || "story"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {s.chapter?.title}
            </span>
            {s.status === "published" ? (
              <span className="ml-auto text-[10px] font-semibold text-success">Published</span>
            ) : (
              <span className="ml-auto text-[10px] font-semibold text-warning">Draft</span>
            )}
          </div>
          <h3 className="font-semibold text-foreground">{s.title || "Untitled"}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {s.content || "No content yet."}
          </p>
        </div>
      ))}
    </div>
  );
}

function MemoriesTab({ chapterRows }) {
  const media = chapterRows.flatMap((ch) => [
    ...(ch.media || []),
    ...(ch.stories || []).flatMap((s) => s.media || []),
  ]).filter((m) => m.type === "image");

  if (media.length === 0) {
    return <TabEmpty icon={Icons.camera} label="No memories yet" hint="Photos you add to stories appear here." />;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      {media.map((m, i) => (
        <img
          key={i}
          src={m.url}
          alt=""
          className="aspect-square w-full rounded-xl object-cover"
        />
      ))}
    </div>
  );
}

function LikesTab({ total }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-xs">
      <Icons.heartRegular className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="font-display font-semibold text-foreground">{total} likes received</p>
      <p className="text-sm text-muted-foreground mt-1">
        Readers love your stories. Keep writing!
      </p>
    </div>
  );
}

function ActivityTab({ chapterRows }) {
  const events = chapterRows
    .flatMap((ch) =>
      (ch.stories || []).map((s) => ({
        id: s._id || s.id,
        title: s.title,
        chapter: ch.title,
        date: s.updatedAt || s.createdAt,
        published: s.status === "published",
      })),
    )
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 20);

  if (events.length === 0) {
    return <TabEmpty icon={Icons.sparkles} label="No activity yet" hint="Your writing history shows up here." />;
  }

  return (
    <div className="relative pl-5 space-y-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
      {events.map((e) => (
        <div key={e.id} className="relative">
          <span
            className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-card ${
              e.published ? "bg-success" : "bg-warning"
            }`}
          />
          <p className="text-sm font-medium text-foreground">
            {e.published ? "Published" : "Edited"} “{e.title || "Untitled"}”
          </p>
          <p className="text-xs text-muted-foreground">
            {e.chapter} ·{" "}
            {e.date ? new Date(e.date).toLocaleDateString() : "recently"}
          </p>
        </div>
      ))}
    </div>
  );
}

function TabEmpty({ icon: Icon, label, hint }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="font-display font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}

/* ================= Edit modal ================= */

function EditProfileModal({
  formState,
  avatarPreview,
  avatarRef,
  onAvatarChange,
  saving,
  onSave,
  onClose,
}) {
  const {
    fullName, setFullName,
    profession, setProfession,
    bio, setBio,
    city, setCity,
    country, setCountry,
  } = formState;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-lg max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-display text-lg font-bold text-foreground">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-5 space-y-4">
          {/* Avatar picker */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                src={avatarPreview}
                name={fullName}
                size="xl"
                className="w-20 h-20"
              />
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              >
                <Icons.camera className="h-5 w-5" />
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tap the avatar to change your profile photo.
            </p>
          </div>

          <Field label="Full Name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Profession">
            <input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Writer, Teacher…"
              className={inputCls}
            />
          </Field>
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Dreamer. Traveler. Lifelong learner."
              className={`${inputCls} resize-y`}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bangalore"
                className={inputCls}
              />
            </Field>
            <Field label="Country">
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
