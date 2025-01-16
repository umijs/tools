import { GoogleGenerativeAI } from "@google/generative-ai";
import assert from 'assert';

export async function chat(query: string) {
  assert(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.9,
      topP: 1,
      topK: 1,
      maxOutputTokens: 2048,
    },
  });
  const chat = model.startChat({
  });
  const result = await chat.sendMessage(query);
  const response = await result.response;
  const text = response.text();
  return text;
}
