import { processEmbeddingJob } from "./embedding.worker.js";

const workers = {
  "embed-story": ({ storyId }) => processEmbeddingJob(storyId),
};

export const processSQSRecord = async (record) => {
  const body = JSON.parse(record.body);
  const worker = workers[body.jobType];

  if (!worker) {
    throw new Error(`Unknown job type: ${body.jobType}`);
  }

  return worker(body);
};
