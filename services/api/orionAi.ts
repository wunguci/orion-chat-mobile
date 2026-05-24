import { fetchApi } from "./fetch-api";
import { AIMessage, Conversation } from "@/types/aichat";

export type AiCardTone = "neutral" | "positive" | "warning" | "danger" | "info";
export type RewriteTone = "professional" | "polite" | "concise";

export interface AiCard {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  tone?: AiCardTone;
  icon?: string;
  meta?: Record<string, unknown>;
}

export interface AiTable {
  columns: Array<{ key: string; label: string; width?: string }>;
  rows: Array<Record<string, unknown>>;
}

export interface AiAction {
  id: string;
  label: string;
  type: "create_task" | "create_event" | "open_item" | "copy_text" | "none";
  payload?: Record<string, unknown>;
  disabled?: boolean;
}

export interface AiGridResponse {
  id: string;
  type: string;
  title: string;
  summary: string;
  confidence: number;
  generatedAt: string;
  layout: {
    variant: "grid" | "table" | "compact" | "empty";
    columns: { mobile: number; tablet: number; desktop: number };
  };
  cards: AiCard[];
  table?: AiTable;
  actions: AiAction[];
  meta: Record<string, unknown>;
}

export interface OrionAiSettings {
  smartEmotionDetection: boolean;
  autoWorkflowSuggestions: boolean;
  aiMemoryEnabled: boolean;
  enabledAgents: string[];
}

interface ApiAiSession {
  _id?: string;
  id?: string;
  title?: string;
  aiModel?: string;
  systemPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiAiMessage {
  _id?: string;
  id?: string;
  content: string;
  aiMessageRole: "USER" | "ASSISTANT";
  createdAt?: string;
}

const toDate = (value?: string) => (value ? new Date(value) : new Date());

const mapSession = (session: ApiAiSession): Conversation => ({
  id: session._id || session.id || Date.now().toString(),
  serverSessionId: session._id || session.id,
  title: session.title || "New Chat",
  description: "",
  type: "chat",
  status: "active",
  messages: [],
  createdAt: toDate(session.createdAt),
  updatedAt: toDate(session.updatedAt),
});

const mapMessage = (message: ApiAiMessage): AIMessage => ({
  id: message._id || message.id || Date.now().toString(),
  role: message.aiMessageRole === "ASSISTANT" ? "assistant" : "user",
  content: message.content,
  timestamp: toDate(message.createdAt),
});

export const extractPrimaryText = (response: AiGridResponse): string => {
  const copyPayload = response.actions.find(
    (action) => action.type === "copy_text" && typeof action.payload?.text === "string",
  )?.payload?.text;

  if (typeof copyPayload === "string" && copyPayload.trim()) {
    return copyPayload.trim();
  }

  const cardBody = response.cards.find((card) => card.body?.trim())?.body;
  if (cardBody?.trim()) {
    return cardBody.trim();
  }

  const cardTitle = response.cards.find((card) => card.title?.trim())?.title;
  if (cardTitle?.trim()) {
    return cardTitle.trim();
  }

  return response.summary || "";
};

export const formatGridResponse = (response: AiGridResponse): string => {
  const parts = [response.summary];

  response.cards.slice(0, 6).forEach((card) => {
    const body = card.body ? `\n${card.body}` : "";
    parts.push(`• ${card.title}${body}`);
  });

  if (response.table?.rows?.length) {
    response.table.rows.slice(0, 6).forEach((row) => {
      parts.push(
        Object.entries(row)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(" | "),
      );
    });
  }

  return parts.filter(Boolean).join("\n\n");
};

export const orionAiApi = {
  listSessions: async () => {
    const sessions = await fetchApi<ApiAiSession[]>("/ai-sessions/me");
    return sessions.map(mapSession);
  },

  createSession: async (payload?: {
    title?: string;
    aiModel?: string;
    systemPrompt?: string;
  }) => {
    const session = await fetchApi<ApiAiSession>("/ai-sessions", {
      method: "POST",
      body: JSON.stringify({
        aiModel: "qwen2.5:7b",
        ...payload,
      }),
    });

    return mapSession(session);
  },

  getSessionMessages: async (sessionId: string) => {
    const messages = await fetchApi<ApiAiMessage[]>(`/ai-sessions/${sessionId}/messages`);
    return messages.map(mapMessage);
  },

  sendSessionMessage: (sessionId: string, message: string) =>
    fetchApi<{ assistantMessage: string; tokenUsed?: number }>(
      `/ai-sessions/${sessionId}/send`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      },
    ),

  updateSession: (sessionId: string, payload: { title?: string }) =>
    fetchApi<ApiAiSession>(`/ai-sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getSettings: () => fetchApi<OrionAiSettings>("/orion-ai/settings"),

  updateSettings: (payload: Partial<OrionAiSettings>) =>
    fetchApi<OrionAiSettings>("/orion-ai/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  summarizeConversation: (payload: {
    conversationId: string;
    mode?: "range" | "unread";
    rangeMonths?: 1 | 2 | 3;
  }) =>
    fetchApi<AiGridResponse>("/orion-ai/chat/summarize", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  suggestReplies: (payload: { conversationId: string; limit?: number }) =>
    fetchApi<AiGridResponse>("/orion-ai/chat/reply-suggestions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  rewriteMessage: (payload: {
    message: string;
    tone: RewriteTone;
    audience?: string;
  }) =>
    fetchApi<AiGridResponse>("/orion-ai/chat/rewrite", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  detectEmotion: (payload: { messageId?: string; text?: string }) =>
    fetchApi<AiGridResponse>("/orion-ai/chat/emotion", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
