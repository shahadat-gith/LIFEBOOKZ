import { useEffect, useRef, useState, useCallback } from "react";
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
import EditProfileModal from "../components/profile/EditProfileModal";

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
  const { author, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [stories, setStories] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("lifebook");
  const [editOpen, setEditOpen] = useState(false);
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

  // ?complete=1 → open the edit form so the author can finish their profile
  // (required before a story can be published).
  useEffect(() => {
    if (searchParams.get("complete")) setEditOpen(true);
  }, [searchParams]);

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
      toast.success(
        author?.isProfileCompleted
          ? "Profile updated"
          : "Profile completed — you can now publish stories",
      );
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
      <ProfileHeader
        author={author}
        bio={bio}
        onShare={handleShare}
        onEdit={() => setEditOpen(true)}
      />

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

      {/* ═══════════ Edit modal ═══════════ */}
      {editOpen && (
        <EditProfileModal
          formState={{
            fullName,
            setFullName,
            profession,
            setProfession,
            bio,
            setBio,
            city,
            setCity,
            country,
            setCountry,
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
