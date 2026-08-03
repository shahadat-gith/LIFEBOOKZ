import mongoose from "mongoose";

import app from "./app.js";
import config from "./shared/config/index.js";
import { connectDatabase } from "./shared/config/database.js";
import { startConsumer } from "./shared/sqs/consumer.js";

let server;

async function start() {
  try {
    await connectDatabase();

    server = app.listen(config.port, () => {
      console.log(`🚀 LifeBookz API running on port ${config.port}`);
    });

    // Consume SQS jobs (analysis → enrichment → embedding) in-process during
    // local dev so the pipeline works out of the box. Safe no-op when the
    // queue URL is not configured (see startConsumer).
    startConsumer();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();