import { ENV } from "@/config/env";
import { AIMessage } from "@/types/aichat";
import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!ENV.GEMINI_API_KEY) {
      console.warn("Gemini API key not found. Please check your .env file.");
    }
    this.genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: ENV.GEMINI_MODEL });
  }

  // Chat conversation với context
  async chat(message: string, history: AIMessage[]): Promise<string> {
    try {
      const chatHistory = history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const chat = this.model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error(
        `Failed to get AI response: ${error.message || "Unknown error"}`,
      );
    }
  }

  // Summarize text
  async summarize(text: string): Promise<string> {
    const prompt = `Please summarize the following text in a concise way:\n\n${text}`;
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  // Write content
  async write(prompt: string): Promise<string> {
    const enhancedPrompt = `Write a well-structured content based on: ${prompt}`;
    const result = await this.model.generateContent(enhancedPrompt);
    return result.response.text();
  }

  // Translate
  async translate(text: string, targetLang: string): Promise<string> {
    const prompt = `Translate the following text to ${targetLang}:\n\n${text}`;
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  // Stream response (cho typing effect)
  async *streamChat(message: string, history: AIMessage[]) {
    const chatHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = this.model.startChat({ history: chatHistory });
    const result = await chat.sendMessageStream(message);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }
}

export const geminiService = new GeminiService();
