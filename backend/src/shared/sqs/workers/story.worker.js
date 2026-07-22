import Story from "../../../story/models/Story.js";
import { publishMessage } from "../publishers.js";

import { generateContent } from "../../services/llm.js";
import { generateEmbedding } from "../../services/embedding.js";

import {
  getStoryAnalysisPrompt,
  getSummaryPrompt,
} from "../../prompts/story.js";

import { getQdrantClient } from "../../config/qdrant.js";
import config from "../../config/index.js";

const qdrant = getQdrantClient();

export async function processStoryJob({ jobType, storyId }) {
  switch (jobType) {
    case "story_analysis":
      return analyzeStory(storyId);

    case "story_summary":
      return generateSummary(storyId);

    case "story_embedding":
      return generateStoryEmbedding(storyId);

    default:
      throw new Error(`Unknown story job type: ${jobType}`);
  }
}

async function getStory(storyId) {
  const story = await Story.findById(storyId);

  if (!story) {
    throw new Error(`Story not found: ${storyId}`);
  }

  return story;
}

async function analyzeStory(storyId) {
  const story = await getStory(storyId);

  // idempotency
  if (
    story.verification.status === "completed" ||
    story.status === "rejected"
  ) {
    return;
  }

  await Story.findByIdAndUpdate(storyId, {
    $set: {
      status: "processing",
      "verification.status": "processing",
    },
  });

  try {
    const result = JSON.parse(
      await generateContent({
        system: getStoryAnalysisPrompt(),
        prompt: story.content,
        json: true,
      }),
    );

    await Story.findByIdAndUpdate(storyId, {
      $set: {
        "verification.status": "completed",
        "verification.canProceed": result.canProceed,
        "verification.issues": result.issues ?? [],
        status: result.canProceed ? "processing" : "rejected",
      },
    });

    if (!result.canProceed) return;

    await publishMessage({
      jobType: "story_summary",
      storyId,
    });
  } catch (error) {
    await Story.findByIdAndUpdate(storyId, {
      $set: {
        "verification.status": "failed",
      },
    });

    throw error;
  }
}

async function generateSummary(storyId) {
  const story = await getStory(storyId);

  if (story.summary.status === "completed") {
    return;
  }

  await Story.findByIdAndUpdate(storyId, {
    $set: {
      "summary.status": "processing",
    },
  });

  try {
    const summary = await generateContent({
      system: getSummaryPrompt(),
      prompt: story.content,
    });

    await Story.findByIdAndUpdate(storyId, {
      $set: {
        "summary.status": "completed",
        "summary.content": summary.trim(),
      },
    });

    await publishMessage({
      jobType: "story_embedding",
      storyId,
    });
  } catch (error) {
    await Story.findByIdAndUpdate(storyId, {
      $set: {
        "summary.status": "failed",
      },
    });

    throw error;
  }
}

async function generateStoryEmbedding(storyId) {
  const story = await getStory(storyId);

  if (story.status === "published") {
    return;
  }

  try {
    // Get title from story or auto-generate from content
    const title = story.title?.trim()
      || (story.content
        ? story.content.replace(/<[^>]*>/g, "").trim().slice(0, 100).replace(/\s+\S*$/, "") + "..."
        : "Untitled");

    const embedding = await generateEmbedding(story.summary.content || title);

    await qdrant.upsert(config.qdrant.collections.story, {
      wait: true,
      points: [
        {
          id: story.id,
          vector: embedding,
          payload: {
            storyId: story.id,
            authorId: story.author.toString(),
            title,
            summary: story.summary.content || "",
          },
        },
      ],
    });

    await Story.findByIdAndUpdate(storyId, {
      $set: {
        status: "published",
        publishedAt: new Date(),
      },
    });
  } catch (error) {
    throw error;
  }
}
