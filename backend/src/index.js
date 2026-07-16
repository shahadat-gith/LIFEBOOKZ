import mongoose from "mongoose";

import app from "./app.js";
import config from "./shared/config/index.js";
import { connectDatabase } from "./shared/config/database.js";

let server;

async function start() {
  try {
    await connectDatabase();

    server = app.listen(config.port, () => {
      console.log(`🚀 LifeBookz API running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);

  if (server) {
    server.close();
  }

  await mongoose.connection.close();

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();