import { publishMessage } from "../shared/sqs/publishers.js";
import Story from "./models/Story.js";

export async function create(req, res, next) {
  try {
    const { title = "", content = "", tags = [] } = req.body;

    const story = await Story.create({
      author: req.user.id,
      title,
      content,
      tags,
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      data: story,
    });
  } catch (e) {
    next(e);
  }
}


export async function submit(req, res, next) {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({
      _id: storyId,
      author: req.user.id,
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found.",
      });
    }

    story.status = "submitted";
    story.verification.status = "pending";
    story.summary.status = "pending";

    await story.save();

    await publishMessage({
      jobType: "story_analysis",
      storyId: story.id,
    });

    return res.json({
      success: true,
      message: "Story submitted successfully.",
    });
  } catch (e) {
    next(e);
  }
}