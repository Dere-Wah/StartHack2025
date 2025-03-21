export interface Message {
  role: "user" | "assistant" | "system" | "transcript";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  username: string;
  messages: Message[];
}
