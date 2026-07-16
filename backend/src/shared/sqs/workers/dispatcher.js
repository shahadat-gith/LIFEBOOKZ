import { processStoryJob } from "./story.worker.js";
import { processUserJob } from "./user.worker.js";

const workers = {
  story_analysis: processStoryJob,
  story_summary: processStoryJob,
  story_embedding: processStoryJob,
  user_embedding: processUserJob,

};

export async function dispatch(message) {
  const worker = workers[message.jobType];

  if (!worker) {
    throw new Error(`Unknown job type: ${message.jobType}`);
  }

  return worker(message);
}