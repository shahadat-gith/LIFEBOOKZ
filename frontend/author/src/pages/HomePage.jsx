import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

import { useAuth } from "../context/AuthContext";
import * as storyClient from "../utils/client";

import LoadingScreen from "../components/common/LoadingScreen";
import TestimonialForm from "../components/home/TestimonialForm";
import TestimonialsSection from "../components/home/TestimonialsSection";
import GreetingHero from "../components/home/GreetingHero";
import WritingGuide from "../components/home/WritingGuide";
import QuickActions from "../components/home/QuickActions";
import DraftsList from "../components/home/DraftsList";
import StoriesForYou from "../components/home/StoriesForYou";
import InfoCards from "../components/home/InfoCards";
import { Icons } from "../icons";
import toast from "react-hot-toast";

export default function HomePage() {
  const navigate = useNavigate();
  const { author, isLoading: authLoading } = useAuth();

  const [myBooks, setMyBooks] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [testimonialKey, setTestimonialKey] = useState(0);

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
    const drafts = myBooks.filter((b) => b.status !== "published").length;
    return { drafts };
  }, [myBooks]);

  if (authLoading || loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!author) return null;

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
      onClick: () => navigate("/profile"),
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
      onClick: () => navigate("/feed"),
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
      <GreetingHero author={author} />

      {/* ═══════════ How to write your story ═══════════ */}
      <WritingGuide onStart={() => navigate("/stories/new")} />

      {/* ═══════════ My drafts (with delete) ═══════════ */}
      <DraftsList books={myBooks} onDelete={handleDeleteDraft} deletingId={deletingId} />

      {/* ═══════════ Stories For You (other authors only) ═══════════ */}
      <StoriesForYou stories={feed} />

      {/* ═══════════ Why write + Writing tips ═══════════ */}
      <InfoCards />

      {/* ═══════════ Share your experience ═══════════ */}
      <div className="mb-10">
        <TestimonialForm onSubmitted={() => setTestimonialKey((k) => k + 1)} />
      </div>

      {/* ═══════════ Community testimonials ═══════════ */}
      <TestimonialsSection refreshKey={testimonialKey} />
    </div>
  );
}
