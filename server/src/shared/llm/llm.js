import { OpenRouter } from "@openrouter/sdk";
import config from "../config/index.js";

export const llm = new OpenRouter({
  apiKey: config.openrouter.apiKey,
});
