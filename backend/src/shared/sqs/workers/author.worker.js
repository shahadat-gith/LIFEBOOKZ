import Story from "../../../story/models/Story.js";
import { publishMessage } from "../publishers.js";
import { generateContent } from "../../services/llm.js";
import { generateEmbedding } from "../../services/embedding.js";

import { getQdrantClient } from "../../config/qdrant.js";
import config from "../../config/index.js";

import { getAuthorSummaryPrompt } from "../../prompts/author.js";

import { getQdrantClient } from "../../config/qdrant.js";
import config from "../../config/index.js";

const qdrant = getQdrantClient();

export async function processAuthorJob({ jobType, authorId }) {
  switch (jobType) {
    case "author_embedding":
      return generateAuthorEmbedding(authorId);

    default:
      throw new Error(`Unknown author job type: ${jobType}`);
  }
}

async function getAuthor(authorId) {
  const author = await Author.findById(authorId);

  if (!author) {
    throw new Error(`Author not found: ${authorId}`);
  }

  return author;
}

async function generateAuthorEmbedding(authorId) {
  const author = await getAuthor(authorId);

  if (author.ai.status === "processing") {
    return;
  }

  await Author.findByIdAndUpdate(authorId, {
    $set: {
      "ai.status": "processing",
    },
  });

  try {
    const summary = await generateContent({
      system: getAuthorSummaryPrompt(),
      prompt: `
            Name: ${author.fullName}
            Bio:
            ${author.bio}`,
    });

    const embedding = await generateEmbedding(summary);

    await qdrant.upsert(config.qdrant.collections.user, {
      wait: true,
      points: [
        {
          id: author.id,
          vector: embedding,
          payload: {
            authorId: author.id,
            fullName: author.fullName,
            summary,
          },
        },
      ],
    });

    await Author.findByIdAndUpdate(authorId, {
      $set: {
        "ai.summary": summary,
        "ai.status": "completed",
      },
    });
  } catch (error) {
    await Author.findByIdAndUpdate(authorId, {
      $set: {
        "ai.status": "failed",
      },
    });

    throw error;
  }
}
