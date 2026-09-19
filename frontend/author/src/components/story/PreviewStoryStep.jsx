import { useState } from "react";
import { Icons } from "../../icons";
import { WizardShell } from "./WizardShell";
import Avatar from "../ui/Avatar";
import RichText from "../common/RichText";
import { richTextToPlain } from "../../utils/richText";
import { useAuth } from "../../context/AuthContext";

const TYPE_LABELS = {
  experience: "Experience",
  achievement: "Achievement",
  challenge: "Challenge",
  memory: "Memory",
  lesson: "Lesson",
  other: "Other",
};

export default function PreviewStoryStep({
  story,
  chapter,
  chapterIndex,
  onPublish,
  onBack,
}) {
  const { author } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const isLong = richTextToPlain(story.content).length > 320;
  const images = (story.media || []).filter((m) => m.type === "image");
  const cover =
    images[0]?.url ||
    chapter?.coverImage?.url ||
    chapter?.media?.find((m) => m.type === "image")?.url;

  return (
    <WizardShell step={7} totalSteps={9} title="Preview Story" onBack={onBack}>
      <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        {/* Chapter badge */}
        <div className="px-4 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
            <Icons.book className="h-3.5 w-3.5 text-accent" />
            Chapter: {chapter?.title || `Chapter ${chapterIndex + 1}`}
          </span>
        </div>

        {/* Cover */}
        {cover && (
          <div className="px-4 mt-3">
            <img
              src={cover}
              alt=""
              className="w-full h-44 object-cover rounded-xl"
            />
          </div>
        )}

        <div className="p-4">
          {/* Author */}
          <div className="flex items-center gap-2.5">
            <Avatar
              src={author?.avatar?.url}
              name={author?.fullName}
              size="sm"
            />
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-foreground">
                {author?.fullName || "You"}
              </span>
              {author?.verification?.status === "approved" && (
                <Icons.verified className="h-3.5 w-3.5 text-info" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="mt-3 font-display text-2xl font-bold text-foreground leading-snug">
            {story.title || "Untitled Story"}
          </h2>

          {/* When / Where */}
          {(story.dateLabel || story.location) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {story.dateLabel && (
                <span className="inline-flex items-center gap-1">
                  <Icons.clock className="h-3.5 w-3.5" />
                  {story.dateLabel}
                </span>
              )}
              {story.location && (
                <span className="inline-flex items-center gap-1">
                  <Icons.globe className="h-3.5 w-3.5" />
                  {story.location}
                </span>
              )}
            </div>
          )}

          {/* Type */}
          <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
            {TYPE_LABELS[story.storyType] || story.storyType}
          </span>

          {/* Content */}
          <RichText
            content={story.content}
            className={`mt-3 text-[15px] leading-relaxed text-foreground ${
              !expanded && isLong ? "line-clamp-6" : ""
            }`}
          />
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-sm font-semibold text-primary underline underline-offset-4"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}

          {/* Media strip */}
          {(story.media || []).length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(story.media || []).map((m, idx) =>
                m.type === "image" ? (
                  <img
                    key={idx}
                    src={m.url}
                    alt=""
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ) : m.type === "video" ? (
                  <video
                    key={idx}
                    src={m.url}
                    className="w-full h-20 object-cover rounded-lg bg-black"
                    muted
                  />
                ) : (
                  <audio key={idx} src={m.url} controls className="col-span-3 w-full" />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onPublish}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3.5 font-display text-sm font-semibold shadow-sm hover:brightness-110 transition-all"
        >
          <Icons.shieldCheck className="h-4 w-4" />
          Publish Story
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card text-foreground px-5 py-3 font-display text-sm font-semibold hover:bg-muted transition-all"
        >
          <Icons.edit className="h-4 w-4" />
          Edit Story
        </button>
      </div>
    </WizardShell>
  );
}
