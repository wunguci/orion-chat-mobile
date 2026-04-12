import API_BASE_URL from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Xây dựng URL với query parameters
 */
const buildUrl = (
    path: string,
    params?: Record<string, string | undefined>,
) => {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value);
            }
        });
    }
    return url.toString();
};

/**
 * Parse JSON response từ API
 */
const toJson = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with ${response.status}`);
    }
    return (await response.json()) as T;
};

/**
 * Lấy JWT token từ AsyncStorage
 */
const getAuthToken = async () => {
    const tokenCandidates = [
        await AsyncStorage.getItem('auth_token'),
        await AsyncStorage.getItem('token'),
        await AsyncStorage.getItem('accessToken'),
    ];

    return tokenCandidates.find((item) => !!item) || null;
};

/**
 * Gửi request HTTP với JWT token
 */
const authFetch = async (url: string, init?: RequestInit) => {
    const token = await getAuthToken();
    const headers = new Headers(init?.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
        ...init,
        headers,
    });
};

// ═══════════════════════════════════════════════════════════
// TYPES / TYPES
// ═══════════════════════════════════════════════════════════

/**
 * Thông tin Conversation
 */
export interface ConversationResponse {
    conversationId: string; // ID da conversation - chính là cái ta cần
    type: 'PRIVATE' | 'GROUP'; // Loại conversation
    autoDeleteDuration?: number; // Thời gian tự động xóa tin nhắn (nếu có)
    createdAt?: string; //
    myRole?: string; //
    myJoinedAt?: string; //
    myIsHidden?: boolean; // Có phải tôi đã ẩn cuộc trò chuyện này không?
    myIsBlocked?: boolean; // Có phải tôi đã chặn cuộc trò chuyện này không?
    myBlockedBy?: string[]; // Danh sách userId những người đã chặn tôi (dành cho group chat)
    lastMessage?: {
        content: string;
        timestamp?: string;
        createdAt?: string;
        senderId?: string;
        senderBy?: string;
        messageType?: string;
        messageStatus?: string;
    };
    groupInfo?: any;
    blockStatus?: any;
    canUnblock: boolean;
    myIsPinned?: boolean;
    myPinnedAt?: string;
    participants: Array<{
        userId: string;
        fullName: string;
        avatarUrl?: string;
        isOnline?: boolean;
        role?: string;
        joinedAt?: string;
    }>;
}

/**
 * Thông tin Message
 */
export interface MessageItem {
    _id: string;
    clientMessageId: string;
    content: string;
    conversationId: string;
    createdAt: string;
    senderBy: string;
    messageType: string;
    messageStatus: string;
    senderName: string;
    senderAvatar: string;
    mediaUrl?: string;

    // Dành cho file attachments
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    replyToMessageId?: string;
    reactions?: Array<{
        userId: string;
        emoji: string;
        reactedAt?: string;
    }>;
}

export interface MessageResponse {
    conversationId: string;
    items: MessageItem[];
}

/**
 * Payload để tạo Conversation
 */
export interface CreateConversationPayload {
    participantIds?: string[];
    receiverId?: string;
    participants?: string[];
}

/**
 * Payload để gửi Message
 */
export interface SendMessagePayload {
    conversationId: string;
    content: string;
    type?: 'text' | 'image' | 'file' | 'audio';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
}

// ═══════════════════════════════════════════════════════════
// CHAT API SERVICE
// ═══════════════════════════════════════════════════════════

/**
 * Chat API Service untuk mobile platform
 * Xử lý tất cả các request liên quan đến chat
 */
export const chatApi = {
    /**
     * Lấy danh sách Conversations của user hiện tại
     */
    async getConversations(userId: string, limit = 20, offset = 0) {
        const response = await authFetch(
            buildUrl('/conversations', {
                userId,
                limit: limit.toString(),
                offset: offset.toString(),
            }),
        );
        return toJson<ConversationResponse[]>(response);
    },

    /**
     * Lấy chi tiết một Conversation bằng ID
     */
    async getConversation(conversationId: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}`),
        );
        return toJson<ConversationResponse>(response);
    },

    async updateAutoDeleteDuration(
        conversationId: string,
        autoDeleteDuration: number,
    ) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/auto-delete-duration`),
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ autoDeleteDuration }),
            },
        );

        return toJson(response);
    },

    async hideConversation(conversationId: string, password: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/hide`),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            },
        );

        return toJson(response);
    },

    async revealConversation(conversationId: string, password: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/reveal`),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            },
        );

        return toJson(response);
    },

    async clearConversationHistory(conversationId: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/clear-history`),
            {
                method: 'POST',
            },
        );

        return toJson(response);
    },

    async blockUser(conversationId: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/block`),
            {
                method: 'POST',
            },
        );

        return toJson(response);
    },

    async unblockUser(conversationId: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/unblock`),
            {
                method: 'POST',
            },
        );

        return toJson(response);
    },

    async getBlockStatus(conversationId: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/block-status`),
        );

        return toJson<{
            isBlocked: boolean;
            iAmBlocked: boolean;
            iAmTheBlocker: boolean;
            blockedAt?: string;
        }>(response);
    },

    async pinConversation(conversationId: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/pin`),
            {
                method: 'POST',
            },
        );

        return toJson(response);
    },

    async unpinConversation(conversationId: string) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/unpin`),
            {
                method: 'POST',
            },
        );

        return toJson(response);
    },

    /**
     * Tạo hoặc lấy Private Conversation với một bạn bè
     * - Dùng endpoint /conversations/private
     * - Server sẽ kiểm tra nếu conversation đã tồn tại thì return, nếu không thì tạo mới
     */
    async createConversation(payload: CreateConversationPayload) {
        const response = await authFetch(buildUrl('/conversations/private'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipientId: payload.receiverId || payload.participantIds?.[0],
            }),
        });
        const data = await toJson<ConversationResponse>(response);
        return data;
    },

    /**
     * Lấy danh sách Messages trong một Conversation
     */
    async getMessages(conversationId: string, limit = 50, offset = 0) {
        const response = await authFetch(
            buildUrl(`/conversations/${conversationId}/messages`, {
                limit: limit.toString(),
                offset: offset.toString(),
            }),
        );
        return toJson<MessageResponse>(response);
    },

    /**
     * Gửi tin nhắn (sử dụng REST API, thường dùng khi WebSocket chưa sẵn sàng)
     */
    async sendMessage(payload: SendMessagePayload) {
        const response = await authFetch(
            buildUrl(`/conversations/${payload.conversationId}/messages`),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: payload.content,
                    type: payload.type || 'text',
                    mediaUrl: payload.mediaUrl,
                    fileName: payload.fileName,
                    fileSize: payload.fileSize,
                }),
            },
        );
        return toJson<MessageResponse>(response);
    },

    async sendAttachment(formData: FormData) {
        const res = await authFetch(`${API_BASE_URL}/messages/upload`, {
            method: 'POST',
            body: formData,
        });
        return toJson<MessageItem>(res);
    },

    /**
     * Đánh dấu tin nhắn là đã đọc
     */
    async markAsRead(conversationId: string, messageId: string) {
        const response = await authFetch(
            buildUrl(
                `/conversations/${conversationId}/messages/${messageId}/read`,
            ),
            {
                method: 'PATCH',
            },
        );
        return toJson<{ success: boolean }>(response);
    },

    async reactToMessage(
        conversationId: string,
        messageId: string,
        emoji: string,
    ) {
        const response = await authFetch(buildUrl('/messages/emoji'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversationId,
                messageId,
                emoji,
            }),
        });

        return toJson<{
            messageId: string;
            conversationId: string;
            reactions: Array<{
                userId: string;
                emoji: string;
                reactedAt?: string;
            }>;
        }>(response);
    },

    async removeReaction(conversationId: string, messageId: string) {
        const response = await authFetch(buildUrl('/messages/emoji/remove'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversationId,
                messageId,
            }),
        });

        return toJson<{
            messageId: string;
            conversationId: string;
            reactions: Array<{
                userId: string;
                emoji: string;
                reactedAt?: string;
            }>;
        }>(response);
    },

    async recallMessageForEveryone(conversationId: string, messageId: string) {
        const response = await authFetch(
            buildUrl('/messages/revoke-for-everyone'),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId,
                    messageId,
                }),
            },
        );

        return toJson<{
            messageId: string;
            conversationId: string;
            revokedAt: string;
        }>(response);
    },

    async deleteMessageForMe(conversationId: string, messageId: string) {
        const response = await authFetch(buildUrl('/messages/delete-for-me'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversationId,
                messageId,
            }),
        });

        return toJson<{
            messageId: string;
            conversationId: string;
            deletedBy: string;
        }>(response);
    },
};
