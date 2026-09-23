import mongoose from "mongoose";
import config from "./index.js";

import dns from "node:dns";

if (config.env === "dev") {
  dns.setServers(["8.8.8.8"]);
}

let connectionPromise = null;

export async function connectDatabase() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Connection is currently being established
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(config.database.url, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("✅ MongoDB connected");
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;

      console.error("❌ Failed to connect to MongoDB");
      console.error(error.message);

      throw error;
    });

  return connectionPromise;
}