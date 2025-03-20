import OpenAI from "openai";
import type { Conversation } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAssistantResponse(
  conversation: Conversation
): Promise<string> {
  try {
    // Use conversation messages directly since system message is already included
    const messages = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    return (
      completion.choices[0].message.content || "I couldn't generate a response."
    );
  } catch (error) {
    console.error("Error generating assistant response:", error);
    throw new Error("Failed to generate assistant response");
  }
}
