import { chatApi, MessageItem } from '@/services/api/chat';
import {
    chatSocketService,
    MessageStatusPayload,
    PresencePayload,
    ReactionPayload,
    SocketConnectionState,
    SocketMessage,
    TypingPayload,
} from '@/services/websocket/chatSocket';
import { AttachmentAsset, Message, MessageType } from '@/types/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

function generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
}

interface UseChatState {
    messages: Message[];
    inputText: string;
    isLoading: boolean;
    error: string | null;
    isOtherUserTyping: boolean;
    isOtherUserOnline: boolean;
    otherUserLastSeenAt?: string;
    connectionState: SocketConnectionState;
    reconnectAttempt: number;
}

const TYPING_IDLE_TIMEOUT_MS = 1500;
const TYPING_VIEW_TIMEOUT_MS = 3000;

const mapMessageStatus = (status?: string): Message['status'] => {
    const normalized = (status || '').toUpperCase();

    if (normalized === 'READ') return 'read';
    if (normalized === 'DELIVERED') return 'delivered';
    if (normalized === 'SENT') return 'sent';
    return 'sent';
};

type SendMessageOptions = {
    replyToMessageId?: string;
    replyToMessageText?: string;
};

export const useChat = (conversationId: string) => {
    const [state, setState] = useState<UseChatState>({
        messages: [],
        inputText: '',
        isLoading: false,
        error: null,
        isOtherUserTyping: false,
        isOtherUserOnline: false,
        otherUserLastSeenAt: undefined,
        connectionState: 'disconnected',
        reconnectAttempt: 0,
    });

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const typingViewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const wasTypingRef = useRef(false);

    useEffect(() => {
        let isMounted = true;

        const bootstrap = async () => {
            const candidates = [
                await AsyncStorage.getItem('auth_user'),
                await AsyncStorage.getItem('user'),
                await AsyncStorage.getItem('current_user'),
                await AsyncStorage.getItem('userId'),
            ];

            for (const raw of candidates) {
                if (!raw) continue;

                try {
                    const parsed =
                        typeof raw === 'string' ? JSON.parse(raw) : raw;
                    const id = parsed?.id || parsed?.userId || parsed;

                    if (id && isMounted) {
                        setCurrentUserId(String(id));
                        return;
                    }
                } catch {
                    // Ignore parse errors của key không đúng JSON.
                    continue;
                }
            }
        };

        void bootstrap();

        return () => {
            isMounted = false;
        };
    }, []);

    const updateMessageStatus = useCallback(
        (payload: {
            messageId?: string;
            clientMessageId?: string;
            status: Message['status'];
        }) => {
            setState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) => {
                    const matchesServerId =
                        payload.messageId && msg.id === payload.messageId;
                    const matchesClientId =
                        payload.clientMessageId &&
                        msg.id === payload.clientMessageId;

                    if (!matchesServerId && !matchesClientId) {
                        return msg;
                    }

                    return {
                        ...msg,
                        status: payload.status,
                        id: payload.messageId || msg.id,
                    };
                }),
            }));
        },
        [],
    );

    const updateMessageReactions = useCallback(
        (messageId: string, reactions: NonNullable<Message['reactions']>) => {
            setState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) => {
                    if (msg.id !== messageId) {
                        return msg;
                    }

                    return {
                        ...msg,
                        reactions,
                    };
                }),
            }));
        },
        [],
    );

    const stopTyping = useCallback(() => {
        if (!conversationId || !wasTypingRef.current) {
            return;
        }

        wasTypingRef.current = false;
        chatSocketService.sendTyping(conversationId, false);
    }, [conversationId]);

    const emitTyping = useCallback(() => {
        if (!conversationId) {
            return;
        }

        if (!wasTypingRef.current) {
            chatSocketService.sendTyping(conversationId, true);
            wasTypingRef.current = true;
        }

        if (typingIdleTimerRef.current) {
            clearTimeout(typingIdleTimerRef.current);
        }

        typingIdleTimerRef.current = setTimeout(() => {
            stopTyping();
        }, TYPING_IDLE_TIMEOUT_MS);
    }, [conversationId, stopTyping]);

    useEffect(() => {
        if (!conversationId || !currentUserId) {
            return;
        }

        let isMounted = true;

        const initializeChat = async () => {
            try {
                setState((prev) => ({ ...prev, isLoading: true, error: null }));

                const offConnection = chatSocketService.onConnectionState(
                    (connectionState, attempts = 0) => {
                        setState((prev) => ({
                            ...prev,
                            connectionState,
                            reconnectAttempt: attempts,
                        }));
                    },
                );

                if (!chatSocketService.isConnected()) {
                    await chatSocketService.connect();
                }

                if (!isMounted) {
                    offConnection();
                    return;
                }

                chatSocketService.joinConversation(conversationId);

                const [messagesFromApi, conversationDetail] = await Promise.all(
                    [
                        chatApi.getMessages(conversationId, 50, 0),
                        chatApi
                            .getConversation(conversationId)
                            .catch(() => null),
                    ],
                );

                if (!isMounted) {
                    offConnection();
                    return;
                }

                const otherParticipant = conversationDetail?.participants?.find(
                    (item) => item.userId !== currentUserId,
                );

                const formattedMessages = (messagesFromApi.items || []).map(
                    (msg) => convertApiMessageToUIMessage(msg, currentUserId),
                );

                const sortedMessages = formattedMessages.sort((a, b) => {
                    const dateA = new Date(a.timestamp || '').getTime() || 0;
                    const dateB = new Date(b.timestamp || '').getTime() || 0;
                    return dateA - dateB;
                });

                setState((prev) => ({
                    ...prev,
                    messages: sortedMessages,
                    isLoading: false,
                    isOtherUserOnline: Boolean(otherParticipant?.isOnline),
                    otherUserLastSeenAt: undefined,
                }));

                const handleNewMessage = (socketMsg: SocketMessage) => {
                    if (!isMounted) {
                        return;
                    }

                    const isMine = socketMsg.message.senderBy === currentUserId;

                    setState((prev) => {
                        if (socketMsg.message.clientMessageId) {
                            const index = prev.messages.findIndex(
                                (m) =>
                                    m.id === socketMsg.message.clientMessageId,
                            );

                            if (index !== -1) {
                                const updateMsg = [...prev.messages];
                                updateMsg[index] = {
                                    ...updateMsg[index],
                                    id: socketMsg.message._id,
                                    status: mapMessageStatus(
                                        socketMsg.message.messageStatus,
                                    ),
                                };

                                return {
                                    ...prev,
                                    messages: updateMsg,
                                };
                            }
                        }

                        const exists = prev.messages.some(
                            (m) => m.id === socketMsg.message._id,
                        );
                        if (exists) {
                            return prev;
                        }

                        return {
                            ...prev,
                            messages: [
                                ...prev.messages,
                                {
                                    id: socketMsg.message._id,
                                    chatId: conversationId,
                                    senderId: socketMsg.message.senderBy,
                                    type: normalizeSocketMessageType(
                                        socketMsg.message.messageType,
                                    ),
                                    text: socketMsg.message.content,
                                    timestamp: socketMsg.message.createdAt,
                                    replyToMessageId:
                                        socketMsg.message.replyToMessageId,
                                    isMine,
                                    status: isMine
                                        ? mapMessageStatus(
                                              socketMsg.message.messageStatus,
                                          )
                                        : undefined,
                                },
                            ],
                        };
                    });
                };

                const handleAck = (ackData: any) => {
                    if (!isMounted) {
                        return;
                    }

                    updateMessageStatus({
                        messageId: ackData.messageId,
                        clientMessageId: ackData.clientMessageId,
                        status: mapMessageStatus(ackData.messageStatus),
                    });
                };

                const handleTyping = (payload: TypingPayload) => {
                    if (!isMounted || payload.userId === currentUserId) {
                        return;
                    }

                    setState((prev) => ({
                        ...prev,
                        isOtherUserTyping: payload.isTyping,
                    }));

                    if (typingViewTimerRef.current) {
                        clearTimeout(typingViewTimerRef.current);
                    }

                    if (payload.isTyping) {
                        typingViewTimerRef.current = setTimeout(() => {
                            setState((prev) => ({
                                ...prev,
                                isOtherUserTyping: false,
                            }));
                        }, TYPING_VIEW_TIMEOUT_MS);
                    }
                };

                const handleMessageStatus = (payload: MessageStatusPayload) => {
                    if (!isMounted) {
                        return;
                    }

                    updateMessageStatus({
                        messageId: payload.messageId,
                        clientMessageId: payload.clientMessageId,
                        status: mapMessageStatus(payload.status),
                    });
                };

                const handleReaction = (payload: ReactionPayload) => {
                    if (!isMounted) {
                        return;
                    }

                    updateMessageReactions(
                        payload.messageId,
                        payload.reactions,
                    );
                };

                const offPresence = chatSocketService.onPresence(
                    (payload: PresencePayload) => {
                        if (!isMounted || payload.userId === currentUserId) {
                            return;
                        }

                        if (
                            payload.conversationId &&
                            payload.conversationId !== conversationId
                        ) {
                            return;
                        }

                        setState((prev) => ({
                            ...prev,
                            isOtherUserOnline: payload.isOnline,
                            otherUserLastSeenAt: payload.lastSeenAt,
                        }));
                    },
                );

                const offMessage = chatSocketService.onMessage(
                    conversationId,
                    handleNewMessage,
                );
                const offAck = chatSocketService.onAck(
                    conversationId,
                    handleAck,
                );
                const offTyping = chatSocketService.onTyping(
                    conversationId,
                    handleTyping,
                );
                const offMessageStatus = chatSocketService.onMessageStatus(
                    conversationId,
                    handleMessageStatus,
                );
                const offReaction = chatSocketService.onReaction(
                    conversationId,
                    handleReaction,
                );

                return () => {
                    offMessage();
                    offAck();
                    offTyping();
                    offMessageStatus();
                    offReaction();
                    offConnection();
                    offPresence();
                };
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                setState((prev) => ({
                    ...prev,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Khong the tai chat',
                    isLoading: false,
                }));
            }
        };

        let cleanupSubscriptions: (() => void) | undefined;

        void initializeChat().then((cleanup) => {
            cleanupSubscriptions = cleanup;
        });

        return () => {
            isMounted = false;
            stopTyping();
            chatSocketService.leaveConversation(conversationId);
            cleanupSubscriptions?.();

            if (typingIdleTimerRef.current) {
                clearTimeout(typingIdleTimerRef.current);
            }

            if (typingViewTimerRef.current) {
                clearTimeout(typingViewTimerRef.current);
            }
        };
    }, [conversationId, currentUserId, stopTyping, updateMessageStatus]);

    const sendMessage = useCallback(
        (text: string, options?: SendMessageOptions) => {
            if (!text.trim() || !currentUserId || !conversationId) {
                return;
            }

            const clientMessageId = generateUniqueId();

            const optimisticMessage: Message = {
                id: clientMessageId,
                chatId: conversationId,
                senderId: currentUserId,
                type: 'TEXT',
                text: text.trim(),
                replyToMessageId: options?.replyToMessageId,
                replyToMessageText: options?.replyToMessageText,
                timestamp: new Date().toISOString(),
                isMine: true,
                status: 'sending',
            };

            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, optimisticMessage],
                inputText: '',
            }));

            stopTyping();

            chatSocketService.sendMessage(
                conversationId,
                text.trim(),
                clientMessageId,
                (ackData) => {
                    updateMessageStatus({
                        messageId: ackData.messageId,
                        clientMessageId,
                        status: mapMessageStatus(ackData.messageStatus),
                    });
                },
                {
                    replyToMessageId: options?.replyToMessageId,
                },
            );
        },
        [conversationId, currentUserId, stopTyping, updateMessageStatus],
    );

    const sendAttachment = useCallback(
        async (asset: AttachmentAsset, options?: SendMessageOptions) => {
            if (!currentUserId || !conversationId) {
                return;
            }

            try {
                const mimeType = asset.mimeType ?? '';
                let type: MessageType = 'FILE';

                if (mimeType.startsWith('image/')) type = 'IMAGE';
                else if (mimeType.startsWith('video/')) type = 'VIDEO_PREVIEW';

                const clientMessageId = generateUniqueId();
                const safeFileName = asset.name.replace(/\s+/g, '_');

                const optimisticMessage: Message = {
                    id: clientMessageId,
                    chatId: conversationId,
                    senderId: currentUserId,
                    type,
                    text: safeFileName,
                    replyToMessageId: options?.replyToMessageId,
                    replyToMessageText: options?.replyToMessageText,
                    timestamp: new Date().toISOString(),
                    isMine: true,
                    status: 'sending',
                    ...(type === 'IMAGE' && { imageUri: asset.uri }),
                    ...(type === 'VIDEO_PREVIEW' && {
                        videoUri: asset.uri,
                        videoDuration: asset.duration,
                    }),
                    ...(type === 'FILE' && {
                        fileUri: asset.uri,
                        fileName: safeFileName,
                        fileMimeType: asset.mimeType,
                        fileSize: asset.size,
                    }),
                };

                setState((prev) => ({
                    ...prev,
                    messages: [...prev.messages, optimisticMessage],
                }));

                const formData = new FormData();
                formData.append('file', {
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType,
                } as any);
                formData.append('conversationId', conversationId);

                const uploadData = await chatApi.sendAttachment(formData);
                const mediaUrl = uploadData.mediaUrl || '';

                chatSocketService.sendAttachmentMessage(
                    conversationId,
                    mediaUrl,
                    type,
                    clientMessageId,
                    (ackData) => {
                        updateMessageStatus({
                            messageId: ackData.messageId,
                            clientMessageId,
                            status: mapMessageStatus(ackData.messageStatus),
                        });
                    },
                    {
                        fileName: asset.name,
                        fileSize: asset.size,
                        videoDuration: asset.duration,
                        replyToMessageId: options?.replyToMessageId,
                    },
                );
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    messages: prev.messages.map((msg) => {
                        if (
                            msg.status === 'sending' &&
                            msg.text === asset.name
                        ) {
                            return { ...msg, status: 'sent' };
                        }
                        return msg;
                    }),
                    error:
                        error instanceof Error
                            ? error.message
                            : typeof error === 'string'
                              ? error
                              : 'Failed to send attachment',
                }));
            }
        },
        [conversationId, currentUserId, updateMessageStatus],
    );

    const reactToMessage = useCallback(
        async (messageId: string, emoji: string) => {
            if (!currentUserId || !conversationId || !messageId) {
                return;
            }

            const targetMessage = state.messages.find(
                (msg) => msg.id === messageId,
            );
            if (!targetMessage) {
                return;
            }

            const previous = targetMessage.reactions || [];
            const mine = previous.find(
                (reaction) => reaction.userId === currentUserId,
            );

            const shouldRemove = mine?.emoji === emoji;
            const next = previous.filter(
                (reaction) => reaction.userId !== currentUserId,
            );

            if (!shouldRemove) {
                next.push({
                    userId: currentUserId,
                    emoji,
                    reactedAt: new Date().toISOString(),
                });
            }

            updateMessageReactions(messageId, next);

            try {
                if (shouldRemove) {
                    const response = await chatApi.removeReaction(
                        conversationId,
                        messageId,
                    );
                    updateMessageReactions(messageId, response.reactions || []);
                } else {
                    const response = await chatApi.reactToMessage(
                        conversationId,
                        messageId,
                        emoji,
                    );
                    updateMessageReactions(messageId, response.reactions || []);
                }
            } catch (error) {
                updateMessageReactions(messageId, previous);
                setState((prev) => ({
                    ...prev,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to update reaction',
                }));
            }
        },
        [conversationId, currentUserId, state.messages, updateMessageReactions],
    );

    const deleteMessageForMe = useCallback(
        async (messageId: string) => {
            if (!conversationId || !messageId) {
                return;
            }

            const previous = state.messages;
            setState((prev) => ({
                ...prev,
                messages: prev.messages.filter(
                    (message) => message.id !== messageId,
                ),
            }));

            try {
                await chatApi.deleteMessageForMe(conversationId, messageId);
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    messages: previous,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to delete message',
                }));
            }
        },
        [conversationId, state.messages],
    );

    const recallMessage = useCallback(
        async (messageId: string) => {
            if (!conversationId || !messageId) {
                return;
            }

            const previous = state.messages;

            setState((prev) => ({
                ...prev,
                messages: prev.messages.map((message) => {
                    if (message.id !== messageId) {
                        return message;
                    }

                    return {
                        ...message,
                        text: 'Tin nhan da duoc thu hoi',
                        fileUri: undefined,
                        imageUri: undefined,
                        videoUri: undefined,
                        fileName: undefined,
                        reactions: [],
                    };
                }),
            }));

            try {
                await chatApi.recallMessageForEveryone(
                    conversationId,
                    messageId,
                );
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    messages: previous,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to recall message',
                }));
            }
        },
        [conversationId, state.messages],
    );

    const setInputText = useCallback(
        (text: string) => {
            setState((prev) => ({
                ...prev,
                inputText: text,
            }));

            if (!conversationId) {
                return;
            }

            if (!text.trim()) {
                stopTyping();
                return;
            }

            emitTyping();
        },
        [conversationId, emitTyping, stopTyping],
    );

    return {
        messages: state.messages,
        inputText: state.inputText,
        setInputText,
        sendMessage,
        sendAttachment,
        reactToMessage,
        deleteMessageForMe,
        recallMessage,
        isLoading: state.isLoading,
        error: state.error,
        isOtherUserTyping: state.isOtherUserTyping,
        isOtherUserOnline: state.isOtherUserOnline,
        otherUserLastSeenAt: state.otherUserLastSeenAt,
        connectionState: state.connectionState,
        reconnectAttempt: state.reconnectAttempt,
    };
};

function normalizeSocketMessageType(messageType?: string): MessageType {
    const normalized = (messageType || '').toUpperCase();

    if (normalized === 'IMAGE') return 'IMAGE';
    if (normalized === 'FILE') return 'FILE';
    if (normalized === 'VIDEO' || normalized === 'VIDEO_PREVIEW') {
        return 'VIDEO_PREVIEW';
    }

    return 'TEXT';
}

function convertApiMessageToUIMessage(
    apiMsg: MessageItem,
    currentUserId: string,
): Message {
    const messageType = normalizeSocketMessageType(apiMsg.messageType);

    const baseMessage: Message = {
        id: apiMsg._id,
        chatId: apiMsg.conversationId,
        senderId: apiMsg.senderBy || '',
        type: messageType,
        text: apiMsg.content,
        reactions: Array.isArray(apiMsg.reactions) ? apiMsg.reactions : [],
        replyToMessageId: apiMsg.replyToMessageId,
        timestamp: apiMsg.createdAt || '',
        isMine: apiMsg.senderBy === currentUserId,
        status: mapMessageStatus(apiMsg.messageStatus),
    };

    if (messageType === 'IMAGE' && apiMsg.mediaUrl) {
        return {
            ...baseMessage,
            imageUri: apiMsg.mediaUrl,
        };
    }

    if (messageType === 'FILE' && apiMsg.mediaUrl) {
        return {
            ...baseMessage,
            fileUri: apiMsg.mediaUrl,
            fileName: apiMsg.fileName,
            fileMimeType: apiMsg.mimeType,
            fileSize: apiMsg.fileSize,
        };
    }

    if (messageType === 'VIDEO_PREVIEW' && apiMsg.mediaUrl) {
        return {
            ...baseMessage,
            videoUri: apiMsg.mediaUrl,
            videoThumbnailUri: apiMsg.mediaUrl,
        };
    }

    return baseMessage;
}

export function formatTime(timeString: string): string {
    try {
        const date = new Date(timeString);
        if (Number.isNaN(date.getTime())) {
            return 'Invalid time';
        }

        const now = new Date();
        const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isToday) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        }

        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
        });
    } catch {
        return 'Invalid time';
    }
}

export function getDiffMinutes(date1: string, date2: string): number {
    const t1 = new Date(date1).getTime();
    const t2 = new Date(date2).getTime();

    return Math.abs(t2 - t1) / (1000 * 60);
}
