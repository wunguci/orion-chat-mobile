import { configureStore } from '@reduxjs/toolkit';
import aiReducer from './slices/aiSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
    reducer: {
        ai: aiReducer,
        chat: chatReducer,
        // ... other reducers
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: [
                    'ai/sendMessage/fulfilled',
                    'ai/createConversation',
                    'ai/addMessageToConversation',
                    'ai/loadConversations/fulfilled',
                    'chat/fetchConversations/fulfilled',
                ],
                // Ignore these paths in the state
                ignoredPaths: [
                    'ai.conversations',
                    'ai.currentConversation',
                    'chat.conversations',
                ],
            },
        }),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
