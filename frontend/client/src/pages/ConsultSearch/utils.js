import { coachCategories } from "../../data/coaches";

/** How much of a description the matcher needs to work with. */
export const MIN_PROBLEM_LENGTH = 10;

/** Where the consult context is stashed so the booking form can prefill. */
export const CONSULT_CONTEXT_KEY = "lifebookz-consult-context";

/** The ways a session can happen. Icons are picked by id in the form. */
export const SESSION_TYPES = [
  { id: "video", label: "Video Call" },
  { id: "audio", label: "Audio Call" },
  { id: "chat", label: "Chat" },
];

/** The categories a consult can be matched against, as select options. */
export function categoryOptions() {
  return coachCategories.map((category) => ({
    value: category.id,
    label: category.label,
  }));
}

/**
 * The problem text sent to the matcher: what someone is going through, with
 * the optional "anything else" notes folded in as extra context.
 */
export function buildProblem(problem, details) {
  const clean = problem.trim();
  const extra = details.trim();
  return extra ? `${clean}\n\nAdditional context: ${extra}` : clean;
}

/** What is wrong with the form, or "" when it is ready to submit. */
export function validateConsult({ problem, category }) {
  if (problem.trim().length < MIN_PROBLEM_LENGTH) {
    return `Please describe your problem in at least ${MIN_PROBLEM_LENGTH} characters.`;
  }
  if (!category) {
    return "Please pick a category so we can match you accurately.";
  }
  return "";
}

/** The headline over the matches — or over the absence of them. */
export function resultHeading(count) {
  if (count === 0) return "We couldn't find a good match";
  return count === 1 ? "1 expert found for you" : `${count} experts found for you`;
}

/** Keep the consult context for the booking form, best effort. */
export function saveConsultContext(context) {
  try {
    sessionStorage.setItem(CONSULT_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // sessionStorage unavailable — the booking form still works.
  }
}
