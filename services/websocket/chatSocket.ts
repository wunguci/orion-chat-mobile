import API_BASE_URL from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

export type SocketConnectionState =
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected';

export interface SocketMessage {
    conversationId: string;
    message: {
        _id: string;
        conversationId: string;
        senderBy: string;
        senderName: string;
        senderAvatar?: string;
        content: string;
        messageType: string;
        createdAt: string;
        clientMessageId?: string;
        replyToMessageId?: string;
        messageStatus: 'SENT' | 'DELIVERED' | 'READ';
    };
}

export interface MessageStatusPayload {
    conversationId: string;
    messageId: string;
    clientMessageId?: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
    updatedAt?: string;
}

export interface TypingPayload {
    conversationId: string;
    userId: string;
    isTyping: boolean;
}

export interface PresencePayload {
    conversationId?: string;
    userId: string;
    isOnline: boolean;
    lastSeenAt?: string;
}

export interface ReactionPayload {
    conversationId: string;
    messageId: string;
    reactions: Array<{
        userId: string;
        emoji: string;
        reactedAt?: string;
    }>;
}

export type SendAckCallback = (data: {
    clientMessageId: string;
    messageId: string;
    messageStatus: string;
    timestamp: string;
}) => void;

class ChatSocketService {
    private socket: Socket | null = null;
    private isConnecting = false;

    private messageListeners: Map<string, (message: SocketMessage) => void> =
        new Map();
    private ackListeners: Map<string, (data: any) => void> = new Map();
    private typingListeners: Map<string, (payload: TypingPayload) => void> =
        new Map();
    private messageStatusListeners: Map<
        string,
        (payload: MessageStatusPayload) => void
    > = new Map();
    private presenceListeners: Map<string, (payload: PresencePayload) => void> =
        new Map();
    private reactionListeners: Map<string, (payload: ReactionPayload) => void> =
        new Map();

    private connectionListeners = new Set<
        (state: SocketConnectionState, attempts?: number) => void
    >();

    private joinedConversations = new Set<string>();

    async connect(): Promise<void> {
        if (this.socket?.connected) {
            return;
        }

        if (this.isConnecting) {
            return new Promise((resolve) => {
                const checkConnected = () => {
                    if (this.socket?.connected) {
                        resolve();
                        return;
                    }
                    setTimeout(checkConnected, 120);
                };
                checkConnected();
            });
        }

        this.isConnecting = true;
        this.notifyConnectionState('connecting');

        try {
            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const socketUrl = API_BASE_URL.replace(/\/$/, '');

            this.socket = io(`${socketUrl}/chat`, {
                path: '/socket.io',
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 500,
                reconnectionDelayMax: 30000,
                randomizationFactor: 0.5,
            });

            this.setupConnectionHandlers();
            this.setupMessageListeners();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.isConnecting = false;
                    reject(new Error('Socket connection timeout'));
                }, 12000);

                this.socket?.once('connect', () => {
                    clearTimeout(timeout);
                    this.isConnecting = false;
                    this.notifyConnectionState('connected', 0);
                    resolve();
                });

                this.socket?.once('connect_error', (error) => {
                    clearTimeout(timeout);
                    this.isConnecting = false;
                    this.notifyConnectionState('disconnected');
                    reject(error);
                });
            });
        } catch (error) {
            this.isConnecting = false;
            this.notifyConnectionState('disconnected');
            throw error;
        }
    }

    private setupConnectionHandlers(): void {
        if (!this.socket) {
            return;
        }

        this.socket.off('connect');
        this.socket.off('disconnect');
        this.socket.off('connect_error');
        this.socket.io.off('reconnect_attempt');
        this.socket.io.off('reconnect');
        this.socket.io.off('reconnect_failed');

        this.socket.on('connect', () => {
            this.isConnecting = false;
            this.notifyConnectionState('connected', 0);
            this.rejoinConversations();
        });

        this.socket.on('disconnect', () => {
            this.notifyConnectionState('disconnected');
        });

        this.socket.on('connect_error', () => {
            this.notifyConnectionState('reconnecting');
        });

        this.socket.io.on('reconnect_attempt', (attempt) => {
            this.notifyConnectionState('reconnecting', attempt);
        });

        this.socket.io.on('reconnect', () => {
            this.notifyConnectionState('connected', 0);
            this.rejoinConversations();
            this.setupMessageListeners();
        });

        this.socket.io.on('reconnect_failed', () => {
            this.notifyConnectionState('disconnected');
        });
    }

    private setupMessageListeners(): void {
        if (!this.socket) {
            return;
        }

        this.socket.off('chat:message_new');
        this.socket.off('chat:message_ack');
        this.socket.off('chat:message_status');
        this.socket.off('chat:typing');
        this.socket.off('chat:stop_typing');
        this.socket.off('presence:user_online');
        this.socket.off('presence:user_offline');
        this.socket.off('chat:message_reaction_updated');

        this.socket.on('chat:message_new', (serverData: any) => {
            const data: SocketMessage = {
                conversationId: serverData?.conversationId,
                message: {
                    _id: serverData?.message?._id,
                    conversationId: serverData?.message?.conversationId,
                    senderBy: serverData?.message?.senderBy,
                    senderName: serverData?.message?.senderName,
                    senderAvatar: serverData?.message?.senderAvatar,
                    content: serverData?.message?.content,
                    messageType: serverData?.message?.messageType,
                    createdAt: serverData?.message?.createdAt,
                    clientMessageId: serverData?.message?.clientMessageId,
                    replyToMessageId: serverData?.message?.replyToMessageId,
                    messageStatus: serverData?.message?.messageStatus || 'SENT',
                },
            };

            const callback = this.messageListeners.get(data.conversationId);
            callback?.(data);
        });

        this.socket.on('chat:message_ack', (ackData: any) => {
            const callback = this.ackListeners.get(ackData?.conversationId);

            callback?.({
                clientMessageId: ackData?.clientMessageId,
                messageId: ackData?.messageId || ackData?._id,
                messageStatus: ackData?.messageStatus || 'SENT',
                timestamp: ackData?.createdAt || ackData?.timestamp,
            });
        });

        this.socket.on('chat:message_status', (payload: any) => {
            this.emitMessageStatus({
                conversationId: payload?.conversationId,
                messageId: payload?.messageId || payload?._id,
                clientMessageId: payload?.clientMessageId,
                status: payload?.messageStatus || payload?.status || 'SENT',
                updatedAt: payload?.updatedAt || payload?.timestamp,
            });
        });

        this.socket.on('chat:typing', (payload: any) => {
            this.emitTyping({
                conversationId: payload?.conversationId,
                userId: payload?.userId || payload?.senderId,
                isTyping: payload?.isTyping !== false,
            });
        });

        this.socket.on('chat:stop_typing', (payload: any) => {
            this.emitTyping({
                conversationId: payload?.conversationId,
                userId: payload?.userId || payload?.senderId,
                isTyping: false,
            });
        });

        this.socket.on('presence:user_online', (payload: any) => {
            this.emitPresence({
                conversationId: payload?.conversationId,
                userId: payload?.userId,
                isOnline: true,
            });
        });

        this.socket.on('presence:user_offline', (payload: any) => {
            this.emitPresence({
                conversationId: payload?.conversationId,
                userId: payload?.userId,
                isOnline: false,
                lastSeenAt: payload?.lastSeenAt || payload?.at,
            });
        });

        this.socket.on('chat:message_reaction_updated', (payload: any) => {
            const callback = this.reactionListeners.get(
                payload?.conversationId,
            );
            callback?.({
                conversationId: payload?.conversationId,
                messageId: payload?.messageId,
                reactions: Array.isArray(payload?.reactions)
                    ? payload.reactions
                    : [],
            });
        });

        // Bắt thêm event custom từ backend nếu tên khác chuẩn hiện tại.
        this.socket.onAny((eventName: string, payload: any) => {
            if (eventName.includes('typing') && payload?.conversationId) {
                this.emitTyping({
                    conversationId: payload.conversationId,
                    userId: payload.userId || payload.senderId,
                    isTyping: !eventName.includes('stop'),
                });
            }

            if (eventName.includes('presence') && payload?.userId) {
                this.emitPresence({
                    conversationId: payload.conversationId,
                    userId: payload.userId,
                    isOnline: Boolean(payload.isOnline),
                    lastSeenAt: payload.lastSeenAt || payload.at,
                });
            }

            if (
                eventName.includes('message_status') &&
                payload?.conversationId
            ) {
                this.emitMessageStatus({
                    conversationId: payload.conversationId,
                    messageId: payload.messageId || payload._id,
                    clientMessageId: payload.clientMessageId,
                    status: payload.messageStatus || payload.status || 'SENT',
                    updatedAt: payload.updatedAt,
                });
            }
        });
    }

    private notifyConnectionState(
        state: SocketConnectionState,
        attempts?: number,
    ): void {
        this.connectionListeners.forEach((listener) =>
            listener(state, attempts),
        );
    }

    private emitTyping(payload: TypingPayload): void {
        const callback = this.typingListeners.get(payload.conversationId);
        callback?.(payload);
    }

    private emitMessageStatus(payload: MessageStatusPayload): void {
        const callback = this.messageStatusListeners.get(
            payload.conversationId,
        );
        callback?.(payload);
    }

    private emitPresence(payload: PresencePayload): void {
        this.presenceListeners.forEach((listener) => listener(payload));
    }

    private rejoinConversations(): void {
        this.joinedConversations.forEach((conversationId) => {
            this.socket?.emit('chat:join_conversation', { conversationId });
        });
    }

    joinConversation(conversationId: string): void {
        this.joinedConversations.add(conversationId);

        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('chat:join_conversation', { conversationId });
    }

    leaveConversation(conversationId: string): void {
        this.joinedConversations.delete(conversationId);

        if (this.socket?.connected) {
            this.socket.emit('chat:leave_conversation', { conversationId });
        }

        this.messageListeners.delete(conversationId);
        this.ackListeners.delete(conversationId);
        this.typingListeners.delete(conversationId);
        this.messageStatusListeners.delete(conversationId);
        this.reactionListeners.delete(conversationId);
    }

    sendTyping(conversationId: string, isTyping: boolean): void {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('chat:typing', {
            conversationId,
            isTyping,
        });
    }

    sendMessage(
        conversationId: string,
        content: string,
        clientMessageId: string,
        onAck: SendAckCallback,
        options?: {
            replyToMessageId?: string;
        },
    ): void {
        if (!this.socket?.connected) {
            return;
        }

        const requestId = clientMessageId;

        const timeoutId = setTimeout(() => {
            console.error('[ChatSocket] Timeout waiting ACK', {
                clientMessageId,
                conversationId,
            });
        }, 7000);

        this.socket.emit(
            'chat:send_message',
            {
                requestId,
                conversationId,
                content,
                clientMessageId,
                replyToMessageId: options?.replyToMessageId,
                type: 'text',
                receiverId: '',
            },
            (ackData: any, error: any) => {
                clearTimeout(timeoutId);

                if (error || !ackData) {
                    return;
                }

                const responseData = ackData.data || ackData;

                onAck({
                    clientMessageId: responseData.clientMessageId,
                    messageId: responseData.messageId,
                    messageStatus: responseData.messageStatus || 'SENT',
                    timestamp:
                        responseData.timestamp || new Date().toISOString(),
                });
            },
        );
    }

    sendAttachmentMessage(
        conversationId: string,
        mediaUrl: string,
        messageType: 'IMAGE' | 'FILE' | 'VIDEO_PREVIEW',
        clientMessageId: string,
        onAck: SendAckCallback,
        attachmentData?: {
            fileName?: string;
            fileSize?: number;
            videoDuration?: number;
            replyToMessageId?: string;
        },
    ): void {
        if (!this.socket?.connected) {
            return;
        }

        const payload = {
            requestId: clientMessageId,
            conversationId,
            clientMessageId,
            mediaUrl,
            type: messageType.toUpperCase(),
            messageType,
            fileName: attachmentData?.fileName,
            fileSize: attachmentData?.fileSize,
            videoDuration: attachmentData?.videoDuration,
            replyToMessageId: attachmentData?.replyToMessageId,
            receiverId: '',
        };

        this.socket.emit(
            'chat:send_message',
            payload,
            (ackData: any, error: any) => {
                if (error || !ackData) {
                    return;
                }

                const responseData = ackData.data || ackData;

                onAck({
                    clientMessageId: responseData.clientMessageId,
                    messageId: responseData.messageId,
                    messageStatus: responseData.messageStatus || 'SENT',
                    timestamp:
                        responseData.timestamp || new Date().toISOString(),
                });
            },
        );
    }

    onMessage(
        conversationId: string,
        callback: (message: SocketMessage) => void,
    ): void {
        this.messageListeners.set(conversationId, callback);
    }

    onAck(conversationId: string, callback: (data: any) => void): void {
        this.ackListeners.set(conversationId, callback);
    }

    onTyping(
        conversationId: string,
        callback: (payload: TypingPayload) => void,
    ): void {
        this.typingListeners.set(conversationId, callback);
    }

    onMessageStatus(
        conversationId: string,
        callback: (payload: MessageStatusPayload) => void,
    ): void {
        this.messageStatusListeners.set(conversationId, callback);
    }

    onReaction(
        conversationId: string,
        callback: (payload: ReactionPayload) => void,
    ): void {
        this.reactionListeners.set(conversationId, callback);
    }

    onPresence(callback: (payload: PresencePayload) => void): () => void {
        this.presenceListeners.set(
            `presence_${Date.now()}_${Math.random()}`,
            callback,
        );

        return () => {
            this.presenceListeners.forEach((listener, key) => {
                if (listener === callback) {
                    this.presenceListeners.delete(key);
                }
            });
        };
    }

    onConnectionState(
        callback: (state: SocketConnectionState, attempts?: number) => void,
    ): () => void {
        this.connectionListeners.add(callback);

        return () => {
            this.connectionListeners.delete(callback);
        };
    }

    disconnect(): void {
        if (!this.socket) {
            return;
        }

        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;

        this.messageListeners.clear();
        this.ackListeners.clear();
        this.typingListeners.clear();
        this.messageStatusListeners.clear();
        this.presenceListeners.clear();
        this.reactionListeners.clear();
        this.connectionListeners.clear();
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    private async getAuthToken(): Promise<string | null> {
        const tokenCandidates = [
            await AsyncStorage.getItem('auth_token'),
            await AsyncStorage.getItem('token'),
            await AsyncStorage.getItem('accessToken'),
        ];

        return tokenCandidates.find((item) => !!item) || null;
    }
}

export const chatSocketService = new ChatSocketService();
