import * as Errors from "../../core/utils/errors.js";
import * as developerService from "./service.js";

/* ---------- Authentication ---------- */

export async function login(req, res, next) {
  try {
    const token = await developerService.authenticateDeveloper({
      email: req.body.email,
      password: req.body.password,
      ip: req.ip,
    });

    return res.json({
      success: true,
      data: {
        token,
        developer: developerService.getDeveloperIdentity(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req, res, next) {
  try {
    return res.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    if (!req.developer) {
      throw new Errors.AuthenticationError("Authentication required.");
    }

    return res.json({
      success: true,
      data: developerService.getDeveloperIdentity(),
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Logs ---------- */

/**
 * GET /developer/logs
 */
export async function getLogs(req, res, next) {
  try {
    const data = await developerService.listLogs(req.query);

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /developer/logs/stats
 */
export async function getStats(_req, res, next) {
  try {
    const data = await developerService.getLogStats();

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /developer/logs?olderThanDays=7
 */
export async function clearLogs(req, res, next) {
  try {
    const deletedCount = await developerService.clearLogs({
      olderThanDays: req.query.olderThanDays,
    });

    return res.json({
      success: true,
      data: { deletedCount },
      message: `Deleted ${deletedCount} log entr${deletedCount === 1 ? "y" : "ies"}.`,
    });
  } catch (error) {
    next(error);
  }
}
