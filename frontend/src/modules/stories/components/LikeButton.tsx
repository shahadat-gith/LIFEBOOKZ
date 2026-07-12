import { useState } from 'react';
import { Icons } from '../../../icons';
import { storyApi } from '../../../services/apis/stories';
import { useAuth } from '../../../store/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface LikeButtonProps {
  storyId: string;
  initialLiked?: boolean;
}

export default function LikeButton({ storyId, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [animating, setAnimating] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast('Sign in to like stories');
      navigate('/login');
      return;
    }

    setAnimating(true);
    try {
      const { data } = await storyApi.like(storyId);
      setLiked(data.liked);
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
