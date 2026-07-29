import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useFollowing } from "../../context/FollowingContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Icons } from "../../icons";

export default function FollowButton({
  authorId,
  size = "sm",
}) {
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isFollowing, follow, unfollow } = useFollowing();
  const navigate = useNavigate();

  const following = isFollowing(authorId);

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast("Sign in to follow authors");
      navigate("/login");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      if (following) {
        await unfollow(authorId);
      } else {
        await follow(authorId);
      }
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  }

  const sizeClasses = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2",
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 border ${
        following
          ? hovering
            ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15"
            : "bg-primary/10 text-primary border-primary/20"
          : "bg-primary text-primary-foreground border-primary hover:brightness-110"
      } ${sizeClasses[size]} ${loading ? "opacity-60" : ""}`}
      disabled={loading}
    >
      {loading ? (
        <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <AnimatePresence mode="wait">
          {following ? (
            <motion.span
              key="following"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="inline-flex items-center gap-1.5"
            >
              {hovering ? (
                <>
                  <Icons.close className="h-3.5 w-3.5" />
                  Unfollow
                </>
              ) : (
                <>
                  <Icons.check className="h-3.5 w-3.5" />
                  Following
                </>
              )}
            </motion.span>
          ) : (
            <motion.span
              key="not-following"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="inline-flex items-center gap-1.5"
            >
              <Icons.userAdd className="h-3.5 w-3.5" />
              Follow
            </motion.span>
          )}
        </AnimatePresence>
      )}
    </motion.button>
  );
}
