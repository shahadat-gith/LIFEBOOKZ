import { useState } from "react";
import api from "../../config/axios";
import { Icons } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

function LikeButton({ storyId, liked, likeCount, onLike }) {
  const [animating, setAnimating] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLike(e) {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast("Sign in to like stories");
      navigate("/login");
      return;
    }
    setAnimating(true);
    try {
      const res = await api.post(`/stories/${storyId}/like`);
      onLike(res.data.data.liked);
    } catch {
      toast.error("Failed to like");
    } finally {
      setTimeout(() => setAnimating(false), 300);
    }
  }

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        liked
          ? "text-red-500 bg-red-500/10"
          : "text-muted-foreground hover:text-red-400 hover:bg-muted/50"
      } ${animating ? "scale-110" : "scale-100"}`}
    >
      {liked ? (
        <Icons.heartSolid className="h-4 w-4" />
      ) : (
        <Icons.heartRegular className="h-4 w-4" />
      )}
      <span>{likeCount}</span>
    </button>
  );
}
export default LikeButton;
