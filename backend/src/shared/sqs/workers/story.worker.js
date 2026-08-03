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

  // Idempotency check — skip if the pipeline already moved past analysis
  if (["verified", "rejected", "enriching", "enriched", "published"].includes(story.status)) {
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
        "analysis.canProceed": !!result.canProceed,
        "analysis.issues": Array.isArray(result.issues) ? result.issues : [],
        "analysis.analyzedAt": new Date(),
        "analysis.model": config.openrouter.chatModel || "",
      },
    });

    if (!result.canProceed) return;

    await publishMessage({
      jobType: "story_enrichment",
      storyId,
    });
  } catch (error) {
    console.error(`[SQS] ❌ [analyzeStory] story=${storyId}`, error.message);
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

    // Fallback safely to original Tiptap structure if the returned
    // structure is missing or is not a valid Tiptap doc node
    const isTiptapDoc =
      correctedContent &&
      typeof correctedContent === "object" &&
      !Array.isArray(correctedContent) &&
      correctedContent.type === "doc" &&
      Array.isArray(correctedContent.content) &&
      correctedContent.content.length > 0;

    const updatedContent = isTiptapDoc ? correctedContent : story.content;

    await Story.findByIdAndUpdate(storyId, {
      $set: {
        status: "enriched",
        content: updatedContent,
        language:
          typeof language === "string" && language.trim()
            ? language.trim()
            : story.language || "English",
        // Coerce + clamp to schema limits (findByIdAndUpdate skips validators)
        summary:
          typeof summary === "string" ? summary.trim().slice(0, 500) : "",
        embeddingMetadata:
          typeof embeddingMetadata === "string"
            ? embeddingMetadata.trim().slice(0, 5000)
            : "",
      },
    });

    await publishMessage({
      jobType: "story_embedding",
      storyId,
    });
  } catch (error) {
    console.error(`[SQS] ❌ [enrichStory] story=${storyId}`, error.message);
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

  // Idempotency check
  if (story.status === "published") {
    return;
  }

  try {
    // Embed the rich LLM metadata; fall back to story text so a story is
    // never left stuck in "enriched" when metadata comes back empty.
    const textToEmbed =
      (typeof story.embeddingMetadata === "string" &&
        story.embeddingMetadata.trim()) ||
      (typeof story.summary === "string" && story.summary.trim()) ||
      extractTextFromDocument(story.content);

    if (!textToEmbed) {
      throw new Error("Story has no embeddable text");
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
            authorProfession: story.authorProfession || "",
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
      story.processing = story.processing || {};
      story.processing.currentStep = "completed";
      story.processing.completedAt = new Date();
      if (!story.publishedAt) {
        story.publishedAt = new Date();
      }
      await story.save();
    }
  } catch (error) {
    console.error(`[SQS] ❌ [embedding] story=${storyId}`, error.message);
    await Story.findByIdAndUpdate(storyId, {
      $set: {
        status: "failed",
        "processing.error": error.message || "Story embedding failed",
      },
    });

    throw error;
  }
}
