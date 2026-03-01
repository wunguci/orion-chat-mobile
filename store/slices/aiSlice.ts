import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AIState, Conversation, AIMessage } from "@/types/aichat";
import { geminiService } from "@/services/ai/geminiService";
import { conversationStorage } from "@/services/ai/conservationStorage";

// Async thunks
export const sendMessage = createAsyncThunk(
  "ai/sendMessage",
  async (
    { message, conversationId }: { message: string; conversationId: string },
    { getState },
  ) => {
    const state = getState() as { ai: AIState };
    const conversation = state.ai.conversations.find(
      (c) => c.id === conversationId,
    );

    if (!conversation) throw new Error("Conversation not found");

    const response = await geminiService.chat(message, conversation.messages);
    return { conversationId, message, response };
  },
);

export const loadConversations = createAsyncThunk(
  "ai/loadConversations",
  async () => {
    return await conversationStorage.loadConversations();
  },
);

const initialState: AIState = {
  conversations: [],
  currentConversation: null,
  isLoading: false,
  error: null,
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    createConversation: (
      state,
      action: PayloadAction<Partial<Conversation>>,
    ) => {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: action.payload.title || "New Chat",
        description: "",
        type: action.payload.type || "chat",
        status: "active",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...action.payload,
      };
      state.conversations.unshift(newConversation);
      state.currentConversation = newConversation;
    },
    setCurrentConversation: (state, action: PayloadAction<string>) => {
      state.currentConversation =
        state.conversations.find((c) => c.id === action.payload) || null;
    },
    addMessageToConversation: (
      state,
      action: PayloadAction<{ conversationId: string; message: AIMessage }>,
    ) => {
      const conversation = state.conversations.find(
        (c) => c.id === action.payload.conversationId,
      );
      if (conversation) {
        conversation.messages.push(action.payload.message);
        conversation.updatedAt = new Date();
      }
    },
    archiveConversation: (state, action: PayloadAction<string>) => {
      const conversation = state.conversations.find(
        (c) => c.id === action.payload,
      );
      if (conversation) {
        conversation.status = "archived";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, message, response } = action.payload;
        const conversation = state.conversations.find(
          (c) => c.id === conversationId,
        );

        if (conversation) {
          // Add user message
          conversation.messages.push({
            id: Date.now().toString(),
            role: "user",
            content: message,
            timestamp: new Date(),
          });

          // Add AI response
          conversation.messages.push({
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response,
            timestamp: new Date(),
          });

          conversation.updatedAt = new Date();
          // Update title if first message
          if (conversation.messages.length === 2) {
            conversation.title = message.substring(0, 50);
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to send message";
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
      });
  },
});

export const {
  createConversation,
  setCurrentConversation,
  addMessageToConversation,
  archiveConversation,
} = aiSlice.actions;
export default aiSlice.reducer;
