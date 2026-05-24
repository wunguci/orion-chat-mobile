import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '@/config/api';
import { is } from 'date-fns/locale';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

/**
 * Thông tin tin nhắn từ WebSocket
 */
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

        mediaUrl?: string;
        fileName?: string;
        fileSize?: number;
        mimeType?: string;

        reactions?: [];
    };
}

/**
 * Callback khi gửi tin nhắn thành công
 */
export type SendAckCallback = (data: {
    clientMessageId: string;
    messageId: string;
    messageStatus: string;
    timestamp: string;
}) => void;

// ═══════════════════════════════════════════════════════════
// CHAT SOCKET SERVICE
// ═══════════════════════════════════════════════════════════

class ChatSocketService {
    private socket: Socket | null = null;
    private isConnecting = false;
    private messageListeners: Map<string, (message: SocketMessage) => void> =
        new Map();
    private conversationListeners: Map<string, (data: any) => void> = new Map();
    private reactionListeners: Map<string, (data: any) => void> = new Map();
    private recallListeners: Map<string, (data: any) => void> = new Map();
    private deleteListeners: Map<string, (data: any) => void> = new Map();
    private conversationDeletedListeners: Set<(data: any) => void> = new Set();

    /**
     * Khởi tạo WebSocket connection
     * - Lấy JWT token từ AsyncStorage
     * - Kết nối tới server qua /chat namespace
     * - AWAIT khi socket thực sự connected
     */
    async connect(): Promise<void> {
        // Nếu đã connecting hoặc connected, không cần kết nối lại
        if (this.socket?.connected) {
            //console.log("[ChatSocket] Already connected");
            return;
        }

        if (this.isConnecting) {
            //console.log("[ChatSocket] Already connecting, waiting...");
            // Chờ connection hoàn thành
            return new Promise((resolve) => {
                const checkConnected = () => {
                    if (this.socket?.connected) {
                        resolve();
                    } else {
                        setTimeout(checkConnected, 100);
                    }
                };
                checkConnected();
            });
        }

        this.isConnecting = true;

        try {
            // Lấy JWT token từ AsyncStorage
            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Tạo Socket.io connection với JWT token
            const socketUrl = API_BASE_URL?.replace(/\/$/, ''); // Loại bỏ trailing slash
            this.socket = io(
                `${socketUrl}/chat` || 'http://localhost:3000/chat',
                {
                    path: '/socket.io',
                    auth: {
                        token,
                    },
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 5,
                    transports: ['websocket'],
                },
            );

            // Xử lý connection events
            this.setupConnectionHandlers();

            //console.log("[ChatSocket] Connecting to", socketUrl);

            // WAIT for socket to actually connect
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Socket connection timeout'));
                }, 10000);

                this.socket!.once('connect', () => {
                    clearTimeout(timeout);
                    //console.log("[ChatSocket] Connected and ready");
                    this.isConnecting = false;
                    resolve();
                });

                this.socket!.once('error', (error) => {
                    clearTimeout(timeout);
                    console.error('[ChatSocket] Connection error:', error);
                    this.isConnecting = false;
                    reject(error);
                });
            });
        } catch (error) {
            console.error('[ChatSocket] Connection error:', error);
            this.isConnecting = false;
            throw error;
        }
    }

    /**
     * Setup các handlers cho connection events
     */
    private setupConnectionHandlers(): void {
        if (!this.socket) return;

        // Khi kết nối thành công
        this.socket.on('connect', () => {
            //console.log("[ChatSocket] Connected successfully");
            this.isConnecting = false;
            this.rejoinConversations();
        });

        // Khi mất kết nối
        this.socket.on('disconnect', (reason) => {
            //console.log("[ChatSocket] Disconnected:", reason);
        });

        // Khi có lỗi
        this.socket.on('error', (error) => {
            console.error('[ChatSocket] Error:', error);
        });

        // Khi reconnect
        this.socket.on('reconnect', () => {
            //console.log("[ChatSocket] Reconnected - re-registering listeners");
            this.setupMessageListeners();
        });

        // Setup listeners
        this.setupMessageListeners();

        // DEBUG: Log tất cả events từ server
        this.socket.onAny((eventName: string, ...args: any[]) => {
            if (
                !eventName.startsWith('ping') &&
                !eventName.startsWith('pong')
            ) {
                //console.log(`[ChatSocket] All events - ${eventName}:`, args?.[0]);
            }
        });
    }

    /**
     * Setup global message listeners
     */
    private setupMessageListeners(): void {
        if (!this.socket) return;

        //console.log("[ChatSocket] Setting up message listeners");

        this.socket.off('chat:message_new');
        this.socket.off('chat:message_ack');
        this.socket.off('chat:message_reaction_updated');
        this.socket.off('chat:message_recalled');
        this.socket.off('chat:message_deleted');
        this.socket.off('conversation:deleted');

        // Listen tin nhắn mới từ server
        this.socket.on('chat:message_new', (serverData: any) => {
            const data: SocketMessage = {
                conversationId: serverData.conversationId,
                message: {
                    _id: serverData.message._id,
                    conversationId: serverData.message.conversationId,
                    senderBy: serverData.message.senderBy,
                    senderName: serverData.message.senderName,
                    senderAvatar: serverData.message.senderAvatar,
                    content: serverData.message.content,
                    messageType: serverData.message.messageType,
                    createdAt: serverData.message.createdAt,
                    clientMessageId: serverData.message.clientMessageId,
                    replyToMessageId: serverData.message.replyToMessageId,
                    messageStatus: 'SENT',
                },
            };

            // console.log("[ChatSocket] Received message_new:", {
            //   conversationId: data.conversationId,
            //   messageId: data.message._id,
            //   senderId: data.message.senderName,
            //   messageType: data.message.messageType,
            //   content: data.message.content
            //     ? data.message.content.substring(0, 30)
            //     : "Attachment",
            // });

            // Gọi callback nếu có listener cho conversation này
            const callback = this.messageListeners.get(data.conversationId);
            if (callback) {
                // console.log(
                //   "[ChatSocket] Calling message callback for:",
                //   data.conversationId,
                // );
                callback(data);
            }
        });

        // Listen ACK từ server (xác nhận tin nhắn được lưu)
        this.socket.on('chat:message_ack', (ackData: any) => {
            // console.log("[ChatSocket] Received message_ack:", {
            //   conversationId: ackData.conversationId,
            //   clientMessageId: ackData.clientMessageId,
            //   messageId: ackData.messageId || ackData._id,
            // });

            const callback = this.conversationListeners.get(
                ackData.conversationId,
            );
            if (callback) {
                // console.log(
                //   "[ChatSocket] Calling ACK callback for:",
                //   ackData.conversationId,
                // );
                callback({
                    clientMessageId: ackData.clientMessageId,
                    messageId: ackData.messageId || ackData._id,
                    messageStatus: ackData.messageStatus || 'SENT',
                    timestamp: ackData.createdAt || ackData.timestamp,
                });
            }
            // else {
            //   console.warn(
            //     "[ChatSocket] No ACK listener for conversation:",
            //     ackData.conversationId,
            //   );
            // }
        });

        // Listen emoji reactions
        this.socket.on('chat:message_reaction_updated', (reactionData: any) => {
            console.log('[ChatSocket] Received message_reaction_updated:', {
                conversationId: reactionData.conversationId,
                messageId: reactionData.messageId,
                reactionsCount: reactionData.reactions?.length,
            });

            const callback = this.reactionListeners.get(
                reactionData.conversationId,
            );
            if (callback) {
                callback({
                    conversationId: reactionData.conversationId,
                    messageId: reactionData.messageId,
                    reactions: reactionData.reactions,
                    actedBy: reactionData.actedBy,
                    action: reactionData.action,
                    emoji: reactionData.emoji,
                });
            }
        });

        // Listen message recalled events
        this.socket.on('chat:message_recalled', (recallData: any) => {
            console.log('[ChatSocket] Received message_recalled:', {
                conversationId: recallData.conversationId,
                messageId: recallData.messageId,
                revokedBy: recallData.revokedBy,
            });

            const callback = this.recallListeners.get(
                recallData.conversationId,
            );
            if (callback) {
                callback({
                    conversationId: recallData.conversationId,
                    messageId: recallData.messageId,
                    revokedBy: recallData.revokedBy,
                    revokedAt: recallData.revokedAt,
                    isRevoked: recallData.isRevoked,
                });
            }
        });

        // Listen message deleted events
        this.socket.on('chat:message_deleted', (deleteData: any) => {
            const callback = this.deleteListeners.get(
                deleteData.conversationId,
            );
            if (callback) {
                callback({
                    conversationId: deleteData.conversationId,
                    messageId: deleteData.messageId,
                    deletedBy: deleteData.deletedBy,
                    isDeleted: deleteData.isDeleted,
                });
            }
        });

        this.socket.on('conversation:deleted', (deleteData: any) => {
            this.conversationDeletedListeners.forEach((callback) => {
                callback(deleteData);
            });
        });
    }

    private joinedConversations: Set<string> = new Set();

    /**
     * Join một Conversation (để listen tin nhắn)
     * - Emit event chat:join_conversation tới server
     * - Callback được set qua onMessage() trước join
     */
    joinConversation(conversationId: string): void {
        this.joinedConversations.add(conversationId);

        if (!this.socket?.connected) {
            //console.warn("[ChatSocket] Socket not connected, cannot join");
            return;
        }

        //console.log("[ChatSocket] Joining conversation:", conversationId);
        // Emit event chat:join_conversation tới server
        const requestId = `join-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this.socket.emit('chat:join_conversation', {
            requestId,
            conversationId,
        });
    }

    private rejoinConversations() {
        this.joinedConversations.forEach((conversationId) => {
            //console.log("[ChatSocket] Rejoining:", conversationId);
            const requestId = `rejoin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            this.socket?.emit('chat:join_conversation', {
                requestId,
                conversationId,
            });
        });
    }

    /**
     * Leave một Conversation (ngừng listen)
     */
    leaveConversation(conversationId: string): void {
        if (!this.socket?.connected) return;

        //console.log("[ChatSocket] Leaving conversation:", conversationId);
        const requestId = `leave-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this.socket.emit('chat:leave_conversation', {
            requestId,
            conversationId,
        });

        // Chỉ xóa callback khỏi Maps, không gọi socket.off() để tránh ảnh hưởng đến các conversation khác
        this.messageListeners.delete(conversationId);
        this.conversationListeners.delete(conversationId);
        this.reactionListeners.delete(conversationId);
        this.recallListeners.delete(conversationId);
        this.deleteListeners.delete(conversationId);

        // console.log(
        //   "[ChatSocket] Cleared listeners for conversation:",
        //   conversationId,
        // );
    }

    /**
     * Gửi tin nhắn qua WebSocket
     * - Emit event chat:send_message tới server
     * - Callback sẽ được gọi khi server gửi ACK
     */
    sendMessage(
        conversationId: string,
        content: string,
        clientMessageId: string,
        onAck: SendAckCallback,
    ): void {
        if (!this.socket?.connected) {
            console.error('[ChatSocket] Socket not connected:', {
                isConnected: this.socket?.connected,
                hasSocket: !!this.socket,
            });
            return;
        }

        const requestId = clientMessageId;

        console.log('[ChatSocket] Sending message:', {
            conversationId,
            content,
            clientMessageId,
            requestId,
            socketConnected: this.socket.connected,
            socketId: this.socket.id,
        });

        // Add timeout để catch nếu server không respond
        const timeoutId = setTimeout(() => {
            console.error(
                '[ChatSocket] TIMEOUT: No ACK response from server after 5s',
                {
                    clientMessageId,
                    conversationId,
                    requestId,
                },
            );
        }, 5000);

        this.socket.emit(
            'chat:send_message',
            {
                requestId,
                conversationId,
                content,
                clientMessageId,
                type: 'text',
            },
            (ackData: any, error: any) => {
                clearTimeout(timeoutId);
                // console.log("[ChatSocket] Message emit callback received:", {
                //   ackData,
                //   error,
                //   hasAckData: !!ackData,
                //   hasError: !!error,
                // });

                if (error) {
                    console.error(
                        '[ChatSocket] Server error on message emit:',
                        error,
                    );
                    return;
                }

                if (!ackData) {
                    console.warn('[ChatSocket] Callback received but no data');
                    return;
                }

                // Handle response format - server return { ok, data: { ... } }
                const responseData = ackData.data || ackData;

                // console.log("[ChatSocket] Message ACK received successfully:", {
                //   messageId: responseData.messageId,
                //   timestamp: responseData.timestamp,
                // });

                // Gọi callback khi nhận được ACK từ server
                onAck({
                    clientMessageId: responseData.clientMessageId,
                    messageId: responseData.messageId,
                    messageStatus: 'SENT',
                    timestamp:
                        responseData.timestamp || new Date().toISOString(),
                });
            },
        );

        //  Also log if emit has an error immediately
        this.socket.once('error', (error) => {
            console.error('[ChatSocket] Socket error after emit:', error);
        });
    }

    sendAttachmentMessage(
        conversationId: string,
        mediaUrl: string,
        messageType: 'IMAGE' | 'FILE' | 'VIDEO' | 'VIDEO_PREVIEW',
        clientMessageId: string,
        onAck: SendAckCallback,
        attachmentData?: {
            fileName?: string;
            fileSize?: number;
            videoDuration?: number;
        },
    ): void {
        if (!this.socket?.connected) {
            //console.error("[ChatSocket] Socket not connected");
            return;
        }

        // Map message types to lowercase for API
        let apiType: 'image' | 'file' | 'video' = 'file';
        if (messageType === 'IMAGE') apiType = 'image';
        else if (messageType === 'VIDEO' || messageType === 'VIDEO_PREVIEW')
            apiType = 'video';

        const payload = {
            requestId: clientMessageId,
            conversationId,
            clientMessageId,
            mediaUrl,
            type: apiType,
            messageType,
            content: attachmentData?.fileName || 'Attachment',
            fileName: attachmentData?.fileName,
            fileSize: attachmentData?.fileSize,
            videoDuration: attachmentData?.videoDuration,
        };

        // console.log("[ChatSocket] Sending attachment message:", {
        //   conversationId,
        //   messageType,
        //   clientMessageId,
        // });

        const timeoutId = setTimeout(() => {
            console.error(
                '[ChatSocket] TIMEOUT: No ACK response from server after 5s',
                {
                    clientMessageId,
                    conversationId,
                },
            );
        }, 5000);

        this.socket.emit(
            'chat:send_message',
            payload,
            (ackData: any, error: any) => {
                clearTimeout(timeoutId);

                if (error) {
                    // console.error(
                    //   "[ChatSocket] Server error on attachment message emit:",
                    //   error,
                    // );
                    return;
                }

                const responseData = ackData.data || ackData;

                // console.log("[ChatSocket] Attachment message ACK received:", {
                //   messageId: responseData.messageId,
                //   timestamp: responseData.timestamp,
                // });

                onAck({
                    clientMessageId: responseData.clientMessageId,
                    messageId: responseData.messageId,
                    messageStatus: 'SENT',
                    timestamp:
                        responseData.timestamp || new Date().toISOString(),
                });
            },
        );
    }

    /**
     * Đăng ký callback để listen tin nhắn mới
     */
    onMessage(
        conversationId: string,
        callback: (message: SocketMessage) => void,
    ): void {
        // console.log(
        //   "[ChatSocket] Registering message listener for conversation:",
        //   conversationId,
        // );
        this.messageListeners.set(conversationId, callback);
    }

    /**
     * Đăng ký callback để listen ACK
     */
    onAck(conversationId: string, callback: (data: any) => void): void {
        // console.log(
        //   "[ChatSocket] Registering ACK listener for conversation:",
        //   conversationId,
        // );
        this.conversationListeners.set(conversationId, callback);
    }

    /**
     * Đăng ký callback để listen emoji reactions
     */
    onReaction(conversationId: string, callback: (data: any) => void): void {
        this.reactionListeners.set(conversationId, callback);
    }

    /**
     * Đăng ký callback để listen message recalled events
     */
    onRecall(conversationId: string, callback: (data: any) => void): void {
        this.recallListeners.set(conversationId, callback);
    }

    onDelete(conversationId: string, callback: (data: any) => void): void {
        this.deleteListeners.set(conversationId, callback);
    }

    onConversationDeleted(callback: (data: any) => void): void {
        this.conversationDeletedListeners.add(callback);
    }

    offConversationDeleted(callback: (data: any) => void): void {
        this.conversationDeletedListeners.delete(callback);
    }

    /**
     * Ngắt kết nối WebSocket
     */
    disconnect(): void {
        if (this.socket) {
            //console.log("[ChatSocket] Disconnecting");
            this.socket.disconnect();
            this.socket = null;
            this.messageListeners.clear();
            this.conversationListeners.clear();
            this.reactionListeners.clear();
            this.recallListeners.clear();
            this.deleteListeners.clear();
            this.conversationDeletedListeners.clear();
        }
    }

    /**
     * Kiểm tra xem socket có connected không
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Lấy JWT token từ AsyncStorage
     */
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
