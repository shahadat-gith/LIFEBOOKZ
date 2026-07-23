import { useState } from "react";
import api from "../../config/axios";
import { Icons } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

function LikeButton({ storyId, liked, likeCount, onLike }) {
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLike(e) {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast("Sign in to like stories");
      navigate("/login");
      return;
    }

    if (loading) return;

    // Optimistic UI Update for instant feedback
    const nextLikedState = !liked;
    onLike(nextLikedState);
    setLoading(true);

    try {
      const res = await api.post(`/stories/${storyId}/like`);
      // Reconcile with actual server state if needed
      if (
        res.data?.data?.liked !== undefined &&
        res.data.data.liked !== nextLikedState
      ) {
        onLike(res.data.data.liked);
      }
    } catch {
      // Revert optimistic update on failure
      onLike(liked);
      toast.error("Failed to update like");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={handleLike}
      className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none ${
        liked
          ? "text-destructive bg-destructive/10 hover:bg-destructive/15"
          : "text-muted-foreground hover:text-foreground hover:bg-card/80"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {liked ? (
            <motion.div
              key="liked"
              initial={{ scale: 0.5, rotate: -25 }}
              animate={{ scale: [1.3, 0.95, 1], rotate: 0 }}
              exit={{ scale: 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {Icons?.heartSolid ? (
                <Icons.heartSolid className="h-4 w-4 text-destructive drop-shadow-xs" />
              ) : (
                <span className="text-destructive">♥</span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="unliked"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              {Icons?.heartRegular ? (
                <Icons.heartRegular className="h-4 w-4 transition-colors group-hover:text-destructive" />
              ) : (
                <span className="group-hover:text-destructive">♡</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Animated Animated Counter */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={likeCount}
          initial={{ y: liked ? -6 : 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: liked ? 6 : -6, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="font-medium tracking-tight"
        >
          {likeCount}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export default LikeButton;
