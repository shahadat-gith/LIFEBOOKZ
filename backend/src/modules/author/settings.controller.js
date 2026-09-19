import * as settingsService from "./settings.service.js";

/**
 * GET /authors/me/settings
 * The signed-in author's preferences, always fully populated.
 */
export async function getMe(req, res, next) {
  try {
    const settings = await settingsService.getSettings(req.user?.id);

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /authors/me/settings
 * Partial update — send only what changed.
 */
export async function updateMe(req, res, next) {
  try {
    const settings = await settingsService.updateSettings({
      authorId: req.user?.id,
      patch: req.body,
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}
