import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../../config/api";
import StoryCard from "../../components/story/StoryCard";
import NoDataState from "../../components/common/NoDataState";
import { Icons } from "../../icons";

import AuthorHeader from "./components/AuthorHeader";
import AuthorSkeleton from "./components/AuthorSkeleton";
import AuthorMissing from "./components/AuthorMissing";

/**
 * An author's public profile.
 *
 * This is where following happens: the profile request itself reports
 * whether the signed-in account already follows this author, so the button
 * is drawn correctly from the first paint and never asks a second time.
 */
export default function AuthorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [author, setAuthor] = useState(null);
  const [following, setFollowing] = useState(false);
  const [lifebooks, setLifebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The profile and the author's lifebooks are independent reads, so they
  // load in parallel and one failing never blanks the other.
  useEffect(() => {
    if (!id) return undefined;

    setLoading(true);
    setError("");
    setLifebooks([]);

    api
      .get(`/authors/${id}`)
      .then((res) => {
        setAuthor(res.data.data);
        setFollowing(Boolean(res.data.data.isFollowedByLoggedInUser));
      })
      .catch((err) => {
        setAuthor(null);
        setError(
          err.response?.data?.error?.message ||
            "This author profile could not be located.",
        );
      })
      .finally(() => setLoading(false));

    api
      .get("/stories", { params: { author: id, limit: 20 } })
      .then((res) => setLifebooks(res.data.data.stories || []))
      .catch(() => setLifebooks([]));

    return undefined;
  }, [id]);

  if (loading) return <AuthorSkeleton />;
  if (error || !author) return <AuthorMissing message={error} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-3xl px-4 py-6 pb-28 sm:px-6 md:py-10 md:pb-10"
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icons.chevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      <div className="mt-6">
        <AuthorHeader
          author={author}
          following={following}
          onFollowChange={setFollowing}
        />
      </div>

      {/* What they have written */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Lifebooks
        </h2>

        {lifebooks.length === 0 ? (
          <NoDataState variant="panel"
            icon={Icons.book}
            title="No lifebooks yet"
            description={
              author.isSelf
                ? "Your published lifebooks will appear here."
                : "This author hasn't published a lifebook yet."
            }
            action={
              author.isSelf
                ? {
                    icon: Icons.plus,
                    label: "Write a story",
                    onClick: () => navigate("/stories/new"),
                  }
                : null
            }
          />
        ) : (
          <div className="space-y-5">
            {lifebooks.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
