import { storyType } from "../../utils/storyTypes";

/**
 * The small uppercase pill that labels a story's type.
 *
 * Lists, chapter readers and the dashboard all show one, and they must all
 * show the same colour for the same type — so the palette comes from the
 * shared story-type list rather than a local map per screen.
 */
export default function StoryTypeBadge({ type, className = "" }) {
  const { tint, label } = storyType(type);

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tint} ${className}`}
    >
      {type ? label : "Story"}
    </span>
  );
}
