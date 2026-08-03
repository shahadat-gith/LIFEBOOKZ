import { connectDatabase } from "./src/shared/config/database.js";
import { createCollections } from "./src/shared/config/qdrant.js";
import { startConsumer } from "./src/shared/sqs/consumer.js";

/**
 * Standalone SQS worker process.
 *
 * Run separately from the API (e.g. `npm run worker`) or in a long-running
 * container / EC2. In local dev the consumer is also auto-started inside
 * `src/index.js`, so `npm run dev` is enough to make the pipeline work.
 */
async function start() {
  try {
    await connectDatabase();
    console.log("🚀 LifeBookz SQS Worker connected to database");

    createCollections().catch((error) => {
      console.error(
        "⚠️ Qdrant unavailable — search disabled:",
        error.message,
      );
    });

    await startConsumer();
  } catch (error) {
    console.error("Failed to start worker:", error);
    process.exit(1);
  }
}

start();
