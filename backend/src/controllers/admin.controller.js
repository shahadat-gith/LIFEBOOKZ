import * as adminService from "../services/admin.service.js";

export async function login(req, res, next) {
  try {
    const token = adminService.loginAdmin({
      email: req.body.email,
      password: req.body.password,
    });

    return res.json({
      success: true,
      data: { token, admin: adminService.getAdminIdentity() },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(_req, res, next) {
  try {
    return res.json({
      success: true,
      data: adminService.getAdminIdentity(),
    });
  } catch (error) {
    next(error);
  }
}

export async function dashboard(_req, res, next) {
  try {
    const data = await adminService.getDashboardStats();

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getPendingAuthors(_req, res, next) {
  try {
    const authors = await adminService.listPendingAuthors();

    return res.json({ success: true, data: authors });
  } catch (error) {
    next(error);
  }
}

export async function approveAuthor(req, res, next) {
  try {
    const author = await adminService.approveAuthor({
      authorId: req.params.authorId,
    });

    return res.json({
      success: true,
      message: "Author approved successfully.",
      data: author,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectAuthor(req, res, next) {
  try {
    const author = await adminService.rejectAuthor({
      authorId: req.params.authorId,
      reason: req.body.reason,
    });

    return res.json({
      success: true,
      message: "Author rejected successfully.",
      data: author,
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedAuthors(_req, res, next) {
  try {
    const authors = await adminService.listApprovedAuthors();

    return res.json({ success: true, data: authors });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(_req, res, next) {
  try {
    const users = await adminService.listUsers();

    return res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

export async function getStories(_req, res, next) {
  try {
    const stories = await adminService.listStories();

    return res.json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/stories/:storyId/featured { featured } */
export async function toggleStoryFeatured(req, res, next) {
  try {
    const story = await adminService.setStoryFeatured({
      storyId: req.params.storyId,
      featured: Boolean(req.body.featured),
    });

    return res.json({
      success: true,
      message: story.featured ? "Story featured." : "Story unfeatured.",
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/stories/:storyId/unpublish */
export async function unpublishStory(req, res, next) {
  try {
    const story = await adminService.unpublishStory({
      storyId: req.params.storyId,
    });

    return res.json({
      success: true,
      message: "Story unpublished.",
      data: story,
    });
  } catch (error) {
    next(error);
  }
}

/** DELETE /admin/stories/:storyId */
export async function deleteStory(req, res, next) {
  try {
    await adminService.deleteStory({ storyId: req.params.storyId });

    return res.json({
      success: true,
      message: "Story deleted permanently.",
    });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/users/:userId/status { status } */
export async function setUserStatus(req, res, next) {
  try {
    const user = await adminService.setUserStatus({
      userId: req.params.userId,
      status: req.body.status,
    });

    return res.json({
      success: true,
      message: `User ${user.status}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingExperts(_req, res, next) {
  try {
    const experts = await adminService.listPendingExperts();

    return res.json({ success: true, data: experts });
  } catch (error) {
    next(error);
  }
}

export async function approveExpert(req, res, next) {
  try {
    const expert = await adminService.approveExpert({
      expertId: req.params.expertId,
    });

    return res.json({
      success: true,
      message: "Expert approved successfully.",
      data: expert,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectExpert(req, res, next) {
  try {
    const expert = await adminService.rejectExpert({
      expertId: req.params.expertId,
      reason: req.body.reason,
    });

    return res.json({
      success: true,
      message: "Expert rejected successfully.",
      data: expert,
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedExperts(_req, res, next) {
  try {
    const experts = await adminService.listApprovedExperts();

    return res.json({ success: true, data: experts });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req, res, next) {
  try {
    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
}
