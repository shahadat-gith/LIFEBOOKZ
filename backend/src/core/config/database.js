import mongoose from "mongoose";
import config from "./index.js";

import dns from "node:dns";

if (config.env === "dev") {
  dns.setServers(["8.8.8.8"]);
}

export async function connectDatabase() {
  try {
    await mongoose.connect(config.database.url);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB");
    console.error(error.message);

    process.exit(1);
  }
}



