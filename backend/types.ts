export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  username: string;
  messages: ConversationMessage[];
  user_summary?: string;
}

export interface Conversations {
  [key: string]: Conversation;
}
