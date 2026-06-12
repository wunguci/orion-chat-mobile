export type ConversationType =
  | "chat"
  | "summarize"
  | "write"
  | "translate"
  | "code";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: ConversationType;
}

export interface Conversation {
  id: string;
  serverSessionId?: string;
  title: string;
  description: string;
  type: ConversationType;
  status: "active" | "archived";
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  icon?: string; 
}

export interface AIState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
}
