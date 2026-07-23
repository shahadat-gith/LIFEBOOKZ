import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import Avatar from "../ui/Avatar";

import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";

import { Icons } from "../../icons";
import { getTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";
import { getPlainTextSnippet } from "../../utils/helpers";

const CONTENT_PREVIEW_HEIGHT = 260;

export default function StoryCard({
  story,
  showCommentSection = true,
  showReadMore = true,
  fixedSnippetLength = 180, // Character limit when showReadMore is false
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const [liked, setLiked] = useState(story.likedByUser || false);
  const [likeCount, setLikeCount] = useState(story.stats?.likes || 0);
  const [commentTrigger, setCommentTrigger] = useState(0);
  const contentRef = useRef(null);

  const authorName = story.author?.fullName || "Anonymous Author";
  const timeAgo = getTimeAgo(new Date(story.publishedAt || story.createdAt));
  const storyTitle = story.title || "Untitled Story";

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(story.content || ""),
    [story.content]
  );

  // Plain text snippet used when showReadMore is set to false
  const snippetText = useMemo(
    () => getPlainTextSnippet(sanitizedContent, fixedSnippetLength),
    [sanitizedContent, fixedSnippetLength]
  );

  // Check on mount/content change whether full content overflows preview height
  useEffect(() => {
    if (contentRef.current && showReadMore) {
      const scrollH = contentRef.current.scrollHeight;
      const clientH = contentRef.current.clientHeight;
      setNeedsTruncation(scrollH > clientH + 12);
    }
  }, [sanitizedContent, showReadMore]);

  function handleLike(nowLiked) {
    setLiked(nowLiked);
    setLikeCount((c) => (nowLiked ? c + 1 : c - 1));
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group bg-card border border-border/70 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-border transition-all duration-300"
    >
      {/* Header: Author Info & Published Date */}
      <div className="p-5 pb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={story.author?.avatar?.url}
            name={authorName}
            size="md"
            className="ring-1 ring-border/80 transition-transform group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground tracking-tight truncate block">
              {authorName}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{timeAgo}</span>
              {story.publishedAt && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>
                    {new Date(story.publishedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {story.category && (
          <span className="shrink-0 text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
            {story.category}
          </span>
        )}
      </div>

      {/* Story Title */}
      <div className="px-5 pb-2">
        <h2 className="font-display text-xl font-bold text-foreground leading-snug tracking-tight hover:text-accent transition-colors cursor-pointer">
          {storyTitle}
        </h2>
      </div>

      {/* Story Content Viewport */}
      <div className="relative px-5">
        {showReadMore ? (
          <>
            {/* Dynamic Full HTML Content with Expand Option */}
            <div
              ref={contentRef}
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed transition-all duration-500 ease-in-out"
              style={
                !expanded
                  ? { maxHeight: CONTENT_PREVIEW_HEIGHT, overflow: "hidden" }
                  : { maxHeight: "none" }
              }
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Fade Effect */}
            {!expanded && needsTruncation && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
            )}

            {/* Read Full Story / Show Less Button */}
            {needsTruncation && (
              <div className="relative z-10 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 transition-all"
                >
                  <span>{expanded ? "Show less" : "Read full story"}</span>
                  {Icons?.chevronDown && (
                    <Icons.chevronDown
                      className={`h-3 w-3 transition-transform duration-300 ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Fixed Snippet View for Home Page / Compact Lists */
          <p className="text-sm text-foreground/80 leading-relaxed font-sans line-clamp-3">
            {snippetText}
          </p>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-border/40 bg-muted/20 mt-3">
        <LikeButton
          storyId={story._id}
          liked={liked}
          likeCount={likeCount}
          onLike={handleLike}
        />

        <button
          type="button"
          onClick={() => setCommentTrigger((c) => c + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all active:scale-[0.98]"
        >
          {Icons?.chat && <Icons.chat className="h-4 w-4" />}
          <span>Comment</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: storyTitle, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all active:scale-[0.98]"
          title="Share Story"
        >
          {Icons?.share && <Icons.share className="h-4 w-4" />}
          <span>Share</span>
        </button>
      </div>

      {/* Conditional Inline Comment Drawer */}
      {showCommentSection && (
        <div className="px-5 py-4 border-t border-border/30 bg-muted/10">
          <CommentSection storyId={story._id} commentTrigger={commentTrigger} />
        </div>
      )}
    </motion.article>
  );
}