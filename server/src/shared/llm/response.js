import config from "../config/index.js";
import { llm } from "./llm.js";

const TEMPERATURE = 0.2;

export const generateContent = async ({ system, prompt, json = false }) => {
  const response = await llm.chat.send({
    chatRequest: {
      model: config.openrouter.model,
      temperature: TEMPERATURE,
      response_format: json ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    },
  });

  return response.choices[0].message.content;
};


