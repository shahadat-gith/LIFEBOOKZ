import { processStoryJob } from "./story.worker.js";
import { processUserJob } from "./user.worker.js";

const workers = {
  story_analysis: processStoryJob,
  story_enrichment: processStoryJob,
  story_embedding: processStoryJob,
  user_embedding: processUserJob,
};

export async function dispatch(message) {
  const worker = workers[message.jobType];

  if (!worker) {
    const error = new Error(`Unknown job type: ${message.jobType}`);
    console.error("[SQS] ❌ dispatch:", error.message, JSON.stringify(message));
    throw error;
  }

  return worker(message);
}