import * as searchService from "./service.js";

/**
 * GET /search?q=
 * Semantic story search with optional profession / storyType filters.
 */
export async function semanticSearch(req, res, next) {
  try {
    const results = await searchService.semanticSearch({
      q: req.query.q,
      limit: req.query.limit,
      profession: req.query.profession,
      storyType: req.query.storyType,
      viewer: req.user ? { id: req.user.id, role: req.role } : null,
    });

    res.json({
      success: true,
      data: { results, total: results.length },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /search/professions
 * Distinct professions used as search filters.
 */
export async function getProfessions(req, res, next) {
  try {
    const professions = await searchService.listProfessions();

    res.json({
      success: true,
      data: professions,
    });
  } catch (error) {
    next(error);
  }
}
