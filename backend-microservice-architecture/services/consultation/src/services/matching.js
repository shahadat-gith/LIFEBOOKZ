import { validationError } from "@lifebookz/shared-errors";

import { CONSULT_CATEGORY_IDS, categoryLabel, MIN_PROBLEM_LENGTH } from "../constants.js";

/**
 * Expert matching.
 *
 * The monolith had already removed semantic/vector matching: approved experts
 * are surfaced by category and ranked by rating. That behaviour is preserved
 * exactly — there is no embedding store, no Qdrant, no invented ML step — and
 * `matched` stays `false` so the existing frontend keeps rendering the
 * "here are experts we recommend" copy instead of a match score.
 */
export function createMatchingService({ expertProfiles, logger }) {
  function assertProblem(problem) {
    const clean = problem?.trim();

    if (!clean || clean.length < MIN_PROBLEM_LENGTH) {
      throw validationError(`Please describe your problem in at least ${MIN_PROBLEM_LENGTH} characters.`);
    }

    return clean;
  }

  return {
    async match({ problem, category, limit }) {
      const cleanProblem = assertProblem(problem);
      const cleanCategory = category?.trim() || "";

      if (cleanCategory && !CONSULT_CATEGORY_IDS.includes(cleanCategory)) {
        throw validationError("Unknown consultancy category.");
      }

      const candidates = await expertProfiles.listApprovedCandidates({ category: cleanCategory || undefined });

      // Ranking: rating first, then completed sessions, then name — the last two
      // only exist to make the order deterministic across identical ratings.
      const ranked = [...candidates].sort(
        (a, b) =>
          (b.rating || 0) - (a.rating || 0) ||
          (b.sessions || 0) - (a.sessions || 0) ||
          String(a.fullName || "").localeCompare(String(b.fullName || "")),
      );

      const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);

      const experts = ranked.slice(0, safeLimit).map((expert, index) => ({
        id: String(expert._id),
        fullName: expert.fullName,
        username: expert.username,
        expertise: expert.expertise,
        qualification: expert.qualification,
        categories: expert.categories,
        categoryLabels: (expert.categories || []).map(categoryLabel),
        bio: expert.bio,
        languages: expert.languages,
        experience: expert.experience,
        price: expert.price,
        avatar: expert.avatar,
        rating: expert.rating,
        sessions: expert.sessions,
        matchRank: index + 1,
        matchScore: null,
      }));

      logger?.info?.("Experts matched", { category: cleanCategory || null, candidates: candidates.length, returned: experts.length });

      return { experts, total: experts.length, category: cleanCategory || null, matched: false, problem: cleanProblem };
    },
  };
}
