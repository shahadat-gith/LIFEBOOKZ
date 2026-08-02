import mongoose from "mongoose";

import app from "./app.js";
import config from "./shared/config/index.js";
import { connectDatabase } from "./shared/config/database.js";
import { createCollections } from "./shared/config/qdrant.js";

let server;

async function start() {
  try {
    await connectDatabase();

    // Ensure the Qdrant collections exist so semantic search works out of the
    // box. Non-blocking: if Qdrant is down, the API still starts (search just
    // falls back), and the collections are created on the next boot.
    createCollections().catch((error) => {
      console.error("⚠️ Qdrant unavailable — semantic search disabled:", error.message);
    });

    server = app.listen(config.port, () => {
      console.log(`🚀 LifeBookz API running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();