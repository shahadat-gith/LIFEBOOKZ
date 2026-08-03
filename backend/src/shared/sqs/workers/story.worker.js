import { v5 as uuidv5 } from "uuid";
import Story from "../../../story/models/Story.js";
import Author from "../../../author/model.js";
import { publishMessage } from "../publishers.js";

import { generateContent } from "../../services/llm.js";
import { generateEmbedding } from "../../services/embedding.js";

import {
  getStoryAnalysisPrompt,
  getStoryEnrichmentPrompt,
} from "../../prompts/story.js";

import { getQdrantClient } from "../../config/qdrant.js";
import config from "../../config/index.js";
import { extractTextFromDocument } from "../../utils/helpers.js";
import { parseJsonFromLLM, toQdrantUuid, getStory } from "../../utils/helpers.js";

const qdrant = getQdrantClient();

export async function processStoryJob({ jobType, storyId }) {
  switch (jobType) {
    case "story_analysis":
      return analyzeStory(storyId);

    case "story_enrichment":
      return enrichStory(storyId);

    case "story_embedding":
      return generateStoryEmbedding(storyId);

    default:
      throw new Error(`Unknown story job type: ${jobType}`);
  }
}

async function analyzeStory(storyId) {
  const story = await getStory(storyId);

  // Idempotency check
  if (story.status === "verified" || story.status === "rejected") {
    return;
  }

  await Story.findByIdAndUpdate(storyId, {
    $set: {
      status: "analyzing",
      "processing.currentStep": "analysis",
      "processing.startedAt": story.processing?.startedAt || new Date(),
    },
  });

  try {
    const plainText = extractTextFromDocument(story.content);

    const systemPrompt = getStoryAnalysisPrompt();
    const rawResponse = await generateContent({
      system: systemPrompt,
      prompt: `Title: ${story.title}\n\n${plainText}`,
      json: true,
    });

    const result = parseJsonFromLLM(rawResponse);

    await Story.findByIdAndUpdate(storyId, {
      $set: {
        status: result.canProceed ? "verified" : "rejected",
        "analysis.canProceed": result.canProceed,
        "analysis.issues": result.issues ?? [],
        "analysis.analyzedAt": new Date(),
      },
    });

    if (!result.canProceed) return;

    await publishMessage({
      jobType: "story_enrichment",
      storyId,
    });
  } catch (error) {
    await Story.findByIdAndUpdate(storyId, {
      $set: {
        status: "failed",
        "processing.error": error.message || "Story analysis failed",
      },
    });

    throw error;
  }
}

async function enrichStory(storyId) {
  const story = await getStory(storyId);

  // Idempotency check
  if (story.status === "enriched" || story.status === "published") {
    return;
  }

  await Story.findByIdAndUpdate(storyId, {
    $set: {
      status: "enriching",
      "processing.currentStep": "enrichment",
    },
  });

  try {
    // Pass stringified Tiptap JSON document tree directly to prompt
    const documentContent =
      typeof story.content === "object"
        ? JSON.stringify(story.content)
        : story.content;

    const rawResponse = await generateContent({
      system: getStoryEnrichmentPrompt(),
      prompt: `Title: ${story.title}\n\nDocument Structure:\n${documentContent}`,
      json: true,
    });

    const { language, correctedContent, summary, embeddingMetadata } =
      parseJsonFromLLM(rawResponse);

    // Fallback safely to original Tiptap structure if modified structure is invalid
    const updatedContent =
      correctedContent && typeof correctedContent === "object"
        ? correctedContent
        : story.content;

    await Story.findByIdAndUpdate(storyId, {
      $set: {
        status: "enriched",
        content: updatedContent,
        language: language || story.language || "English",
        summary: (summary || "").trim(),
        embeddingMetadata: (embeddingMetadata || "").trim(),
      },
    });

    await publishMessage({
      jobType: "story_embedding",
      storyId,
    });
  } catch (error) {
    await Story.findByIdAndUpdate(storyId, {
      $set: {
        status: "failed",
        "processing.error": error.message || "Story enrichment failed",
      },
    });

    throw error;
  }
}

async function generateStoryEmbedding(storyId) {
  const story = await getStory(storyId);

  // Embed the rich metadata directly
  const textToEmbed = story.embeddingMetadata || story.summary;
  if (!textToEmbed) {
    return;
  }

  await Story.findByIdAndUpdate(storyId, {
    $set: {
      "processing.currentStep": "embedding",
    },
  });

  const author = await Author.findById(story.author)
    .select("fullName")
    .lean();

  const embedding = await generateEmbedding(textToEmbed);

  // Convert Mongo ObjectId to valid Qdrant UUID format
  const qdrantPointId = toQdrantUuid(story._id);

  // Minimal UI preview payload for vector search cards
  await qdrant.upsert(config.qdrant.collections.story, {
    wait: true,
    points: [
      {
        id: qdrantPointId,
        vector: embedding,
        payload: {
          storyId: story.id,
          authorId: story.author.toString(),
          authorName: author?.fullName || "",
          title: story.title || "",
          summary: story.summary || "",
          storyType: story.storyType || "",
          language: story.language || "English",
          slug: story.slug || "",
          coverImage: story.coverImage?.url || "",
          publishedAt: story.publishedAt
            ? new Date(story.publishedAt).toISOString()
            : new Date().toISOString(),
        },
      },
    ],
  });

  // Use save() to run schema pre-save hooks (slug & publishedAt triggers)
  if (story.status !== "published") {
    story.status = "published";
    story.processing.currentStep = "completed";
    story.processing.completedAt = new Date();
    if (!story.publishedAt) {
      story.publishedAt = new Date();
    }
    await story.save();
  }
}