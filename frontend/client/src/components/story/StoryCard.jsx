import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";

import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";

import { Icons } from "../../icons";
import { getTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const CONTENT_PREVIEW_HEIGHT = 280;

export default function StoryCard({ story, showCommentSection = true }) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const [liked, setLiked] = useState(story.likedByUser || false);
  const [likeCount, setLikeCount] = useState(story.stats?.likes || 0);
  const [commentTrigger, setCommentTrigger] = useState(0);
  const contentRef = useRef(null);

  const authorName = story.author?.fullName || "Unknown Author";
  const timeAgo = getTimeAgo(new Date(story.publishedAt || story.createdAt));
  const storyTitle = story.title || "Untitled Story";
  const commentCount = story.stats?.comments || 0;
  const viewCount = story.stats?.views || 0;

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(story.content || ""),
    [story.content],
  );

  // Check on mount whether content overflows
  useEffect(() => {
    if (contentRef.current) {
      const scrollH = contentRef.current.scrollHeight;
      const clientH = contentRef.current.clientHeight;
      setNeedsTruncation(scrollH > clientH + 10);
    }
  }, [sanitizedContent]);

  // Increment view on mount with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      api.post(`/stories/${story._id}/view`).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [story._id]);

  function handleLike(nowLiked) {
    setLiked(nowLiked);
    setLikeCount((c) => (nowLiked ? c + 1 : c - 1));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Post Header: Author + metadata */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar
            src={story.author?.avatar?.url}
            name={authorName}
            size="md"
            className="ring-2 ring-border/50"
          />
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground truncate block">
              {authorName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span>{timeAgo}</span>
              {story.publishedAt && (
                <>
                  <span>•</span>
                  <span>
                    {new Date(story.publishedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Story Title */}
        <h2 className="text-lg font-bold text-foreground mt-3 leading-snug">
          {storyTitle}
        </h2>
      </div>

      {/* Post Content with Expand/Collapse */}
      <div className="relative">
        <div
          ref={contentRef}
          className="prose prose-sm dark:prose-invert max-w-none px-4 transition-all duration-300"
          style={
            !expanded
              ? { maxHeight: CONTENT_PREVIEW_HEIGHT, overflow: "hidden" }
              : { maxHeight: "none" }
          }
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
        {!expanded && needsTruncation && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        )}
        {needsTruncation && (
          <div className="px-4 pb-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-semibold text-info"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground border-t border-border/30 mt-1">
        <span className="flex items-center gap-1">
          {liked ? (
            <Icons.heartSolid className="h-3.5 w-3.5 text-red-500" />
          ) : (
            <Icons.heartRegular className="h-3.5 w-3.5" />
          )}
          {likeCount} like{likeCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Icons.chat className="h-3.5 w-3.5" />
          {commentCount} comment{commentCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Icons.eye className="h-3.5 w-3.5" />
          {viewCount} view{viewCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-t border-border/30">
        <LikeButton
          storyId={story._id}
          liked={liked}
          likeCount={likeCount}
          onLike={handleLike}
        />
        <button
          onClick={() => setCommentTrigger((c) => c + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <Icons.chat className="h-4 w-4" />
          <span>Comment</span>
        </button>
      </div>

      {/* Inline Comment Section */}
      {showCommentSection && (
        <div className="px-4 pb-3">
          <CommentSection storyId={story._id} commentTrigger={commentTrigger} />
        </div>
      )}
    </motion.div>
  );
}