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

start();