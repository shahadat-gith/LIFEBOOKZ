import { useState } from 'react';
import api from "../../config/axios";
import { Icons } from '../../icons';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function LikeButton({ storyId, initialLiked = false }) {
  const [liked, setLiked] = useState(initialLiked);
  const [animating, setAnimating] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLike(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast('Sign in to like stories');
      navigate('/login');
      return;
    }

    setAnimating(true);
    try {
      const res = await api.post(`/stories/${storyId}/like`);
      setLiked(res.data.data.liked);
    } catch {
      toast.error('Failed to like');
    } finally {
      setTimeout(() => setAnimating(false), 300);
    }
  }

  return (
    <button
      onClick={handleLike}
      className={`
        p-2 rounded-full transition-all duration-200
        ${liked
          ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
          : 'text-muted-foreground hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'
        }
        ${animating ? 'scale-125' : 'scale-100'}
      `}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      {liked ? (
        <Icons.heartSolid className="h-5 w-5" />
      ) : (
        <Icons.heartRegular className="h-5 w-5" />
      )}
    </button>
  );
}

export default LikeButton;
