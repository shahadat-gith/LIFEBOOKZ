import { coachCategories } from "../../data/coaches";

/** How much of a description the matcher needs to work with. */
export const MIN_PROBLEM_LENGTH = 10;

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
  if (count === 0) return "No available expert right now";
  return count === 1 ? "1 expert found for you" : `${count} experts found for you`;
}
