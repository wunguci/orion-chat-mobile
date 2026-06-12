import { configureStore } from "@reduxjs/toolkit";
import aiReducer from "./slices/aiSlice";

export const store = configureStore({
  reducer: {
    ai: aiReducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          "ai/sendMessage/fulfilled",
          "ai/createConversation",
          "ai/addMessageToConversation",
          "ai/loadConversations/fulfilled",
        ],
        // Ignore these paths in the state
        ignoredPaths: ["ai.conversations", "ai.currentConversation"],
      },
    }),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
