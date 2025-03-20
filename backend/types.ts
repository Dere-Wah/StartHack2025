export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  username: string;
  messages: ConversationMessage[];
}

export interface Conversations {
  [key: string]: Conversation;
}
