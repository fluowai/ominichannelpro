
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  // Use gemini-3-flash-preview for basic text tasks
  private model = 'gemini-3-flash-preview';

  async generateResponse(prompt: string, history: { role: string, parts: { text: string }[] }[]) {
    try {
      // Re-instantiate to ensure latest key and compliance with guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: this.model,
        contents: [
          ...history,
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          temperature: 0.7,
          topP: 0.95,
        }
      });

      // Directly access .text property as it is the correct way to get generated text
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Desculpe, tive um problema ao processar sua solicitação.";
    }
  }
}

export const geminiService = new GeminiService();
