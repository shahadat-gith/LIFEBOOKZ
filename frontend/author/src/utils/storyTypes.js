import { Icons } from "../icons";

/**
 * The kinds of story an author can write.
 *
 * One list, because three screens read it: the writing wizard offers every
 * type, the badges colour-code it, and the dashboard labels it. They must
 * never disagree about what a "memory" is called or what colour it wears.
 *
 * - `color` tints the type tile in the wizard
 * - `tint`  is the pastel badge used in lists and readers
 */
export const STORY_TYPES = [
  {
    value: "experience",
    label: "Experience",
    hint: "Something I lived through",
    color: "text-info",
    tint: "bg-blue-500/10 text-info",
    icon: Icons.globe,
  },
  {
    value: "achievement",
    label: "Achievement",
    hint: "Something I'm proud of",
    color: "text-warning",
    tint: "bg-amber-400/15 text-warning",
    icon: Icons.starSolid,
  },
  {
    value: "challenge",
    label: "Challenge",
    hint: "Something I overcame",
    color: "text-destructive",
    tint: "bg-violet-500/10 text-violet-600",
    icon: Icons.shieldCheck,
  },
  {
    value: "memory",
    label: "Memory",
    hint: "A moment I want to remember",
    color: "text-success",
    tint: "bg-rose-500/10 text-rose-600",
    icon: Icons.heartRegular,
  },
  {
    value: "lesson",
    label: "Lesson",
    hint: "Something I learned",
    color: "text-accent",
    tint: "bg-emerald-500/10 text-success",
    icon: Icons.book,
  },
  {
    value: "other",
    label: "Other",
    hint: "Something else important",
    color: "text-primary",
    tint: "bg-muted text-muted-foreground",
    icon: Icons.tag,
  },
];

export const STORY_TYPE_OTHER = STORY_TYPES[STORY_TYPES.length - 1];

/** The type for a stored value, falling back to "Other". */
export function storyType(value) {
  return STORY_TYPES.find((t) => t.value === value) || STORY_TYPE_OTHER;
}
