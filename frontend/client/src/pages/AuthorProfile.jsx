import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/axios";
import Avatar from "../components/ui/Avatar";
import FollowButton from "../components/story/FollowButton";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function AuthorProfilePage() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");

    api
      .get(`/authors/${id}`)
      .then((res) => {
        setAuthor(res.data.data);
      })
      .catch((err) => {
        const msg = err.response?.data?.error?.message || "Author not found";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setStoriesLoading(true);

    api
      .get("/stories", { params: { author: id, limit: 20 } })
      .then((res) => {
        setStories(res.data.data.stories || []);
      })
      .catch(() => {
        setStories([]);
      })
      .finally(() => setStoriesLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 animate-pulse select-none">
        {/* Back link skeleton */}
        <div className="h-4 w-24 bg-muted rounded-md mb-8" />
        {/* Author card skeleton */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-border/60 mb-8">
          <div className="w-24 h-24 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-3 text-center sm:text-left w-full">
            <div className="h-6 bg-muted rounded-md w-48 mx-auto sm:mx-0" />
            <div className="h-4 bg-muted rounded-md w-32 mx-auto sm:mx-0" />
            <div className="h-3 bg-muted rounded-md w-full max-w-md mx-auto sm:mx-0" />
            <div className="h-3 bg-muted rounded-md w-3/4 max-w-sm mx-auto sm:mx-0" />
            <div className="h-9 w-28 bg-muted rounded-xl mx-auto sm:mx-0" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center select-none">
        <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icons.exclamationCircle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 font-display">
          Author Not Found
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {error || "This author profile could not be located."}
        </p>
        <Link
          to="/authors"
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:underline"
        >
          <Icons.chevronLeft className="h-4 w-4" />
          Back to Authors
        </Link>
      </div>
    );
  }

  const socialLinks = author.socialLinks || {};
  const hasSocial = Object.values(socialLinks).some((v) => v);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto py-10 px-4 sm:px-6 select-none"
    >
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <Icons.chevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      {/* Author Profile Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-border/60 mb-8">
          {/* Avatar */}
          <Avatar
            src={author.avatar?.url}
            name={author.fullName || "Author"}
            size="xl"
            className="ring-2 ring-border/60 shrink-0"
          />

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
                {author.fullName || "Anonymous Author"}
              </h1>
              {author.profession && (
                <p className="text-xs font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">
                  {author.profession}
                </p>
              )}
            </div>

            {author.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                {author.bio}
              </p>
            )}

            {/* Follow & Meta */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <FollowButton authorId={author._id} size="md" />

              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Icons.book className="h-3.5 w-3.5 text-muted-foreground" />
                  {stories.length} {stories.length === 1 ? "story" : "stories"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icons.clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Joined{" "}
                  {author.createdAt
                    ? new Date(author.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
              </div>
            </div>

            {/* Social Links */}
            {hasSocial && (
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                {socialLinks.website && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    title="Website"
                  >
                    <Icons.globe className="h-4 w-4" />
                  </a>
                )}
                {socialLinks.x && (
                  <a
                    href={socialLinks.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    title="X (Twitter)"
                  >
                    <Icons.twitter className="h-4 w-4" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    title="Instagram"
                  >
                    <Icons.instagram className="h-4 w-4" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    title="LinkedIn"
                  >
                    <Icons.linkedin className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
