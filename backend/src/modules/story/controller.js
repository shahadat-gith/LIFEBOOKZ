import * as storyService from "./service.js";

const viewerOf = (req) =>
  req.user ? { id: req.user.id, role: req.role } : null;

/**
 * POST /stories/upload-media
 * Upload a media asset (photo / video / audio) used in chapters or stories.
 */
export async function uploadMedia(req, res, next) {
  try {
    const data = await storyService.uploadMediaAsset({
      file: req.file,
      caption: req.body?.caption,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /stories
 * Create lifebook draft.
 */
export async function create(req, res, next) {
  try {
    const story = await storyService.createStory({
      authorId: req.user.id,
      body: req.body,
      file: req.file,
    });

    res.status(201).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /stories/:storyId
 * Update lifebook (allowed in any state — full author control).
 */
export async function update(req, res, next) {
  try {
    const story = await storyService.updateStory({
      authorId: req.user.id,
      storyId: req.params.storyId,
      body: req.body,
      file: req.file,
    });

    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /stories/:storyId
 * Delete lifebook (allowed in any state — full author control).
 */
export async function remove(req, res, next) {
  try {
    await storyService.deleteStory({
      authorId: req.user.id,
      storyId: req.params.storyId,
    });

    res.json({ success: true, message: "Story deleted successfully." });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stories/drafts
 */
export async function getDrafts(req, res, next) {
  try {
    const data = await storyService.listDrafts({
      authorId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stories/:storyId
 * Single lifebook by id or slug.
 */
export async function getStory(req, res, next) {
  try {
    const story = await storyService.getStoryDetail({
      storyId: req.params.storyId,
      viewer: viewerOf(req),
    });

    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stories
 * Published feed.
 */
export async function list(req, res, next) {
  try {
    const data = await storyService.listStories({
      query: req.query,
      viewer: viewerOf(req),
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/* ---------- Chapters ---------- */

export async function addChapter(req, res, next) {
  try {
    const story = await storyService.addChapter({
      authorId: req.user.id,
      storyId: req.params.storyId,
      body: req.body,
    });

    res.status(201).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

export async function updateChapter(req, res, next) {
  try {
    const story = await storyService.updateChapter({
      authorId: req.user.id,
      storyId: req.params.storyId,
      chapterId: req.params.chapterId,
      body: req.body,
    });

    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

export async function deleteChapter(req, res, next) {
  try {
    const story = await storyService.deleteChapter({
      authorId: req.user.id,
      storyId: req.params.storyId,
      chapterId: req.params.chapterId,
    });

    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

export async function reorderChapters(req, res, next) {
  try {
    const story = await storyService.reorderChapters({
      authorId: req.user.id,
      storyId: req.params.storyId,
      chapterIds: req.body.chapterIds,
    });

    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

/* ---------- Chapter stories (individual stories inside a chapter) ---------- */

export async function addChapterStory(req, res, next) {
  try {
    const story = await storyService.addChapterStory({
      authorId: req.user.id,
      storyId: req.params.storyId,
      chapterId: req.params.chapterId,
      body: req.body,
    });

    res.status(201).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

export async function updateChapterStory(req, res, next) {
  try {
    const story = await storyService.updateChapterStory({
      authorId: req.user.id,
      storyId: req.params.storyId,
      chapterId: req.params.chapterId,
      storyEntryId: req.params.storyEntryId,
      body: req.body,
    });

    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

export async function deleteChapterStory(req, res, next) {
  try {
    const story = await storyService.deleteChapterStory({
      authorId: req.user.id,
      storyId: req.params.storyId,
      chapterId: req.params.chapterId,
      storyEntryId: req.params.storyEntryId,
    });

    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

/* ---------- Publishing ---------- */

/**
 * POST /stories/:storyId/publish — synchronous, no review pipeline.
 */
export async function publish(req, res, next) {
  try {
    const data = await storyService.publishStory({
      authorId: req.user.id,
      storyId: req.params.storyId,
      body: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Story published successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /stories/:storyId/unpublish — back to draft, any time.
 */
export async function unpublish(req, res, next) {
  try {
    const data = await storyService.unpublishStory({
      authorId: req.user.id,
      storyId: req.params.storyId,
    });

    res.json({
      success: true,
      message: "Story unpublished.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

/* ---------- Likes ---------- */

export async function toggleLike(req, res, next) {
  try {
    const data = await storyService.toggleLike({
      storyId: req.params.storyId,
      userId: req.user.id,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getLikes(req, res, next) {
  try {
    const likes = await storyService.listLikes({
      storyId: req.params.storyId,
    });

    res.json({ success: true, data: likes });
  } catch (error) {
    next(error);
  }
}

/* ---------- Comments ---------- */

export async function createComment(req, res, next) {
  try {
    const comment = await storyService.createComment({
      storyId: req.params.storyId,
      userId: req.user.id,
      content: req.body.content,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

export async function updateComment(req, res, next) {
  try {
    const comment = await storyService.updateComment({
      commentId: req.params.commentId,
      userId: req.user.id,
      content: req.body.content,
    });

    res.json({ success: true, data: comment });
  } catch ( error ) {
    next(error);
  }
}

export async function deleteComment(req, res, next) {
  try {
    await storyService.deleteComment({
      commentId: req.params.commentId,
      userId: req.user.id,
    });

    res.json({ success: true, message: "Comment deleted successfully." });
  } catch (error) {
    next(error);
  }
}

export async function getComments(req, res, next) {
  try {
    const data = await storyService.listComments({
      storyId: req.params.storyId,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
