import { Icons } from "../icons";

/**
 * Who can read a story.
 *
 * A story's audience is its own setting, so the same two levels are offered
 * wherever a story is written, listed or read. Keeping the wording in one
 * place stops the wizard and the profile describing the same level
 * differently.
 */
export const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Everyone (Public)",
    shortLabel: "Everyone",
    description: "Anyone on Lifebookz can see this story.",
    icon: Icons.globe,
  },
  {
    value: "private",
    label: "Only Me (Private)",
    shortLabel: "Only me",
    description: "Only you can see this story.",
    icon: Icons.lock,
  },
];

/** The option for a stored value — anything unknown reads as public. */
export function visibilityOption(value) {
  return (
    VISIBILITY_OPTIONS.find((option) => option.value === value) ||
    VISIBILITY_OPTIONS[0]
  );
}

/** Confirmation shown after a story's audience changes. */
export function visibilitySavedMessage(value) {
  if (value === "public") return "Story is now visible to everyone";
  return "Story is now private — only you can see it";
}
