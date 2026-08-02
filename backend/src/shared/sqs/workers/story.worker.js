import Story from "../../../story/models/Story.js";
import Author from "../../../author/model.js";
import { publishMessage } from "../publishers.js";

import { generateContent } from "../../services/llm.js";
import { generateEmbedding } from "../../services/embedding.js";

import {
  getStoryAnalysisPrompt,
  getSummaryPrompt,
} from "../../prompts/story.js";

import { getQdrantClient } from "../../config/qdrant.js";
import config from "../../config/index.js";
import { extractTextFromDocument } from "../../utils/helpers.js";

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
    const plainText = extractTextFromDocument(story.document);

    const result = JSON.parse(
      await generateContent({
        system: getStoryAnalysisPrompt(),
        prompt: plainText,
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
    const plainText = extractTextFromDocument(story.document);

    const summary = await generateContent({
      system: getSummaryPrompt(),
      prompt: plainText,
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

  const plainText = extractTextFromDocument(story.document);
  const title = story.title?.trim()
    || (plainText
      ? plainText.slice(0, 100).replace(/\s+\S*$/, "") + "..."
      : "Untitled");

  const summary = story.summary?.content || plainText.slice(0, 500);
  if (!summary) {
    return;
  }

  // Include author details so the embedding + payload capture the necessary context
  const author = story.author
    ? await Author.findById(story.author).select("fullName profession").lean()
    : null;

  // Embed the story together with its key metadata for richer semantics
  const embeddingText = [
    `Title: ${title}`,
    `Story type: ${story.storyType || ""}`,
    `Language: ${story.language || ""}`,
    author?.profession ? `Author profession: ${author.profession}` : "",
    `Summary: ${summary}`,
  ]
    .filter(Boolean)
    .join("\n");

  const embedding = await generateEmbedding(embeddingText);

  await qdrant.upsert(config.qdrant.collections.story, {
    wait: true,
    points: [
      {
        id: story.id,
        vector: embedding,
        payload: {
          storyId: story.id,
          authorId: story.author.toString(),
          authorName: author?.fullName || "",
          authorProfession: (author?.profession || "").toLowerCase(),
          title,
          summary: story.summary.content || "",
          storyType: story.storyType || "",
          language: story.language || "",
          slug: story.slug || "",
          coverImage: story.coverImage?.url || "",
          publishedAt: story.publishedAt
            ? new Date(story.publishedAt).toISOString()
            : "",
        },
      },
    ],
  });

  // Only transition status if the story isn't already published
  if (story.status !== "published") {
    await Story.findByIdAndUpdate(storyId, {
      $set: {
        status: "published",
        publishedAt: new Date(),
      },
    });
  }
}
