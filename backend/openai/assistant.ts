import OpenAI from "openai";
import type { Conversation, Conversations } from "../types";
import type { AudioWebSocket } from "../audio/handler";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store for conversations
export const conversations: Conversations = {};
const WAITER_PROMPT =
  "You are a waiter, taking an order at a pizzeria restaurant. " +
  "When the user explicitly tells you that the conversation is over, and they already have given you the order, please send a message with the keyword CONVERSATION_END" +
  "The order is being trascripted from voice, so the text might not 100% accurate." +
  "In this case, try to guess what the user was trying to say. Make your best attempt at guessing," +
  "and if you are not sure tell the user what you understand. If that's not right they will stop you and correct you." +
  "If there are empty sentences picked up by background noise simply ignore them and reply with a simple hmhm as if you were listening" +
  "If the audio picksup some nonsensical text, just ignore it and ask the user to repeat if you are missing context." +
  "If you are unsure about something the customer told you, becuase it got lost in the noise, try to predict it with the summary you have. Maybe do some small talk about it." +
  " Next you can find the usual preferences and habits of the user. Use them to deduce context such as ordering the usual, or for small talk. For the small talk, feel free to use the information from the user summary to begin and ask questions about the user to involve them.\n";

export async function handleTranscript(
  transcript: string,
  username: string,
  convUuid: string,
  websocket: AudioWebSocket,
  user_summary: string
) {
  // Initialize conversation if it doesn't exist
  if (!conversations[convUuid]) {
    conversations[convUuid] = {
      id: convUuid,
      username,
      messages: [
        {
          role: "system",
          content:
            WAITER_PROMPT + user_summary + "The user is called " + username,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  // Add user message to conversation
  conversations[convUuid].messages.push({
    role: "user",
    content: transcript,
    timestamp: new Date().toISOString(),
  });

  try {
    const messageId = `msg_${Date.now()}`; // Generate a unique message ID
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversations[convUuid].messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        // Send the delta to the websocket with message ID
        websocket.send(
          JSON.stringify({
            type: "assistant_response",
            delta: {
              text: content,
              messageId: messageId,
            },
          })
        );
      }
    }

    // Add the complete response to the conversation
    conversations[convUuid].messages.push({
      role: "assistant",
      content: fullResponse,
      timestamp: new Date().toISOString(),
    });

    // Send a completion message
    websocket.send(
      JSON.stringify({
        type: "assistant_complete",
        messageId: messageId,
        conversation: conversations[convUuid],
      })
    );
  } catch (error) {
    console.error("Error generating assistant response:", error);
    websocket.send(
      JSON.stringify({
        type: "assistant_error",
        error: "Failed to generate response",
      })
    );
  }
}
