import { chatApi, ConversationResponse } from '@/services/api/chat';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

type ConversationState = {
    currentUserId: string | null;
    conversations: ConversationResponse[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    lastSyncedAt: number | null;
};

function getConversationTimestamp(conversation: ConversationResponse): number {
    const value =
        conversation.lastMessage?.createdAt ||
        conversation.lastMessage?.timestamp ||
        conversation.myPinnedAt ||
        conversation.createdAt ||
        '';

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortConversations(
    items: ConversationResponse[],
): ConversationResponse[] {
    return [...items].sort((a, b) => {
        const pinDiff =
            Number(Boolean(b.myIsPinned)) - Number(Boolean(a.myIsPinned));
        if (pinDiff !== 0) {
            return pinDiff;
        }

        return getConversationTimestamp(b) - getConversationTimestamp(a);
    });
}

export const fetchConversations = createAsyncThunk<
    ConversationResponse[],
    { userId: string; refresh?: boolean },
    { rejectValue: string }
>('chat/fetchConversations', async ({ userId }, { rejectWithValue }) => {
    try {
        const rows = await chatApi.getConversations(userId, 100, 0);
        return sortConversations(rows);
    } catch (error) {
        return rejectWithValue(
            error instanceof Error
                ? error.message
                : 'Khong the tai danh sach cuoc tro chuyen',
        );
    }
});

const initialState: ConversationState = {
    currentUserId: null,
    conversations: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastSyncedAt: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setCurrentUserId: (state, action: PayloadAction<string | null>) => {
            state.currentUserId = action.payload;
        },
        patchConversationFromSocket: (
            state,
            action: PayloadAction<{
                conversationId: string;
                content?: string;
                senderBy?: string;
                createdAt?: string;
            }>,
        ) => {
            const index = state.conversations.findIndex(
                (item) => item.conversationId === action.payload.conversationId,
            );

            if (index === -1) {
                return;
            }

            const target = state.conversations[index];
            const unreadKey =
                'unreadCount' in target
                    ? 'unreadCount'
                    : 'unreadMessages' in target
                      ? 'unreadMessages'
                      : 'unread';

            const nextUnread =
                action.payload.senderBy &&
                state.currentUserId &&
                action.payload.senderBy !== state.currentUserId
                    ? ((target as any)[unreadKey] || 0) + 1
                    : (target as any)[unreadKey] || 0;

            const patched: ConversationResponse = {
                ...target,
                lastMessage: {
                    ...(target.lastMessage || {}),
                    content:
                        action.payload.content ||
                        target.lastMessage?.content ||
                        '',
                    senderBy:
                        action.payload.senderBy ||
                        target.lastMessage?.senderBy ||
                        '',
                    createdAt:
                        action.payload.createdAt ||
                        target.lastMessage?.createdAt ||
                        new Date().toISOString(),
                    timestamp:
                        action.payload.createdAt ||
                        target.lastMessage?.timestamp ||
                        new Date().toISOString(),
                },
            };

            (patched as any)[unreadKey] = nextUnread;

            state.conversations.splice(index, 1);
            state.conversations.unshift(patched);
        },
        upsertConversation: (
            state,
            action: PayloadAction<ConversationResponse>,
        ) => {
            const index = state.conversations.findIndex(
                (item) => item.conversationId === action.payload.conversationId,
            );

            if (index >= 0) {
                state.conversations[index] = action.payload;
            } else {
                state.conversations.unshift(action.payload);
            }

            state.conversations = sortConversations(state.conversations);
        },
        markConversationAsRead: (
            state,
            action: PayloadAction<{ conversationId: string }>,
        ) => {
            const target = state.conversations.find(
                (item) => item.conversationId === action.payload.conversationId,
            );

            if (!target) {
                return;
            }

            if ('unreadCount' in target) {
                (target as any).unreadCount = 0;
            } else if ('unreadMessages' in target) {
                (target as any).unreadMessages = 0;
            } else if ('unread' in target) {
                (target as any).unread = 0;
            }
        },
        clearConversations: (state) => {
            state.conversations = [];
            state.error = null;
            state.lastSyncedAt = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state, action) => {
                const isRefresh = Boolean(action.meta.arg.refresh);
                state.error = null;
                state.isLoading = !isRefresh;
                state.isRefreshing = isRefresh;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.conversations = action.payload;
                state.isLoading = false;
                state.isRefreshing = false;
                state.lastSyncedAt = Date.now();
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.error =
                    action.payload ||
                    action.error.message ||
                    'Khong the tai danh sach cuoc tro chuyen';
                state.isLoading = false;
                state.isRefreshing = false;
            });
    },
});

export const {
    setCurrentUserId,
    patchConversationFromSocket,
    upsertConversation,
    markConversationAsRead,
    clearConversations,
} = chatSlice.actions;

export default chatSlice.reducer;
