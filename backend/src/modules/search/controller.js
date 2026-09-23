import * as searchService from "./service.js";

/**
 * GET /search?q=
 * Text search across lifebook titles and the stories inside them.
 */
export async function searchStories(req, res, next) {
  try {
    const results = await searchService.searchStories({
      q: req.query.q,
      limit: req.query.limit,
      profession: req.query.profession,
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
