import mongoose from "mongoose";
import config from "./index.js";

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect("mongodb://localhost:27017/main");

  console.log("✅ MongoDB connected");

  return mongoose.connection;
}