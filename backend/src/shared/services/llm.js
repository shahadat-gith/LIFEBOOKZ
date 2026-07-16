import { OpenRouter } from "@openrouter/sdk";
import config from "../config/index.js";

export const llm = new OpenRouter({
  apiKey: config.openrouter.apiKey,
});

const TEMPERATURE = 0.2;

export async function generateContent({ system, prompt, json = false }) {
  const response = await llm.chat.send({
    chatRequest: {
      model: config.openrouter.chatModel,
      temperature: TEMPERATURE,
      response_format: json ? { type: "json_object" } : undefined,
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    },
  });

  return response.choices[0].message.content;
}
