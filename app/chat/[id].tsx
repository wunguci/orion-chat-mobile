import ChatHeader from '@/components/chat/ChatHeader';
import MessageActionSheet from '@/components/chat/MessageActionSheet';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageDateSeparator from '@/components/chat/MessageDateSeparator';
import MessageInput from '@/components/chat/MessageInput';
import MessageTimestamp from '@/components/chat/MessageTimestamp';
import SwipeToReplyRow from '@/components/chat/SwipeToReplyRow';
import { formatTime, getDiffMinutes, useChat } from '@/hooks/useChat';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import useReplyMessage from '@/hooks/useReplyMessage';
import { useTheme } from '@/hooks/useTheme';
import {
    ConversationResponse,
    SendMessagePayload,
    chatApi,
} from '@/services/api/chat';
import { fetchConversations, setCurrentUserId } from '@/store/slices/chatSlice';
import { AttachmentAsset, Message } from '@/types/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BlockStatus = {
    isBlocked: boolean;
    iAmBlocked: boolean;
    iAmTheBlocker: boolean;
    blockedAt?: string;
};

async function getCurrentUserId(): Promise<string | null> {
    const candidates = [
        await AsyncStorage.getItem('auth_user'),
        await AsyncStorage.getItem('user'),
        await AsyncStorage.getItem('current_user'),
        await AsyncStorage.getItem('userId'),
    ];

    for (const raw of candidates) {
        if (!raw) {
            continue;
        }

        try {
            const parsed = JSON.parse(raw);
            const id = parsed?.id || parsed?.userId || parsed;
            if (id) {
                return String(id);
            }
        } catch {
            if (raw.trim()) {
                return raw;
            }
        }
    }

    return null;
}

function isRemoteUrl(value?: string): boolean {
    return Boolean(value && /^https?:\/\//i.test(value));
}

function buildForwardPayload(
    message: Message,
    conversationId: string,
): SendMessagePayload {
    const fallbackText =
        message.text || message.fileName || 'Tin nhan da chuyen tiep';

    if (message.type === 'IMAGE' && isRemoteUrl(message.imageUri)) {
        return {
            conversationId,
            type: 'image',
            content: fallbackText,
            mediaUrl: message.imageUri,
        };
    }

    if (message.type === 'FILE' && isRemoteUrl(message.fileUri)) {
        return {
            conversationId,
            type: 'file',
            content: fallbackText,
            mediaUrl: message.fileUri,
            fileName: message.fileName,
            fileSize: message.fileSize,
        };
    }

    if (
        message.type === 'VIDEO_PREVIEW' &&
        (isRemoteUrl(message.videoUri) || isRemoteUrl(message.fileUri))
    ) {
        return {
            conversationId,
            type: 'file',
            content: fallbackText,
            mediaUrl: message.videoUri || message.fileUri,
            fileName: message.fileName || 'video.mp4',
            fileSize: message.fileSize,
        };
    }

    return {
        conversationId,
        type: 'text',
        content: fallbackText,
    };
}

function resolveConversationName(
    conversation: ConversationResponse,
    currentUserId: string,
): string {
    if (conversation.type === 'GROUP') {
        return (
            (conversation.groupInfo?.groupName as string | undefined) || 'Nhom'
        );
    }

    const target = conversation.participants.find(
        (item) => item.userId !== currentUserId,
    );

    return target?.fullName || 'Cuoc tro chuyen';
}

function shouldShowAvatar(messages: Message[], index: number): boolean {
    const curr = messages[index];
    if (curr.isMine) return false;
    const next = messages[index + 1];
    return !next || next.isMine;
}

function getDateKey(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'invalid';
    }

    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');

    return `${y}-${m}-${d}`;
}

function getDayLabel(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'Khong xac dinh';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );
    const diffDay = Math.floor((today.getTime() - target.getTime()) / 86400000);

    if (diffDay === 0) return 'Hom nay';
    if (diffDay === 1) return 'Hom qua';

    const weekdayMap = [
        'Chu Nhat',
        'Thu Hai',
        'Thu Ba',
        'Thu Tu',
        'Thu Nam',
        'Thu Sau',
        'Thu Bay',
    ];

    const weekday = weekdayMap[date.getDay()] ?? 'Khong ro';
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();

    return `${weekday}, ${day}/${month}/${year}`;
}

function formatMessageClock(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return '--:--';
    }

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function ChatScreen() {
    const params = useLocalSearchParams<{
        id: string;
        name: string;
        avatarUri?: string;
        focusMessageId?: string;
    }>();

    const router = useRouter();
    const dispatch = useAppDispatch();
    const { conversations, currentUserId } = useAppSelector(
        (state) => state.chat,
    );
    const { id, name, avatarUri } = params;
    const { colors, colorScheme } = useTheme();

    const {
        messages,
        inputText,
        setInputText,
        sendMessage,
        sendAttachment,
        reactToMessage,
        deleteMessageForMe,
        recallMessage,
        isOtherUserTyping,
        isOtherUserOnline,
        otherUserLastSeenAt,
        connectionState,
        reconnectAttempt,
    } = useChat(id || '');

    const listRef = useRef<FlashList<Message>>(null);
    const [actionMessage, setActionMessage] = useState<Message | null>(null);
    const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
    const [isForwardModalVisible, setIsForwardModalVisible] = useState(false);
    const [forwardingMessage, setForwardingMessage] = useState<Message | null>(
        null,
    );
    const [isForwarding, setIsForwarding] = useState(false);
    const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
    const { replyingMessage, setReplyingMessage, clearReply } =
        useReplyMessage();

    React.useEffect(() => {
        if (!id) {
            Alert.alert('Error', 'Invalid chat ID. Going back...');
            setTimeout(() => router.back(), 500);
        }
    }, [id, router]);

    const subtitle = useMemo(() => {
        if (isOtherUserTyping) {
            return 'Dang nhap...';
        }

        if (connectionState === 'reconnecting') {
            return `Dang ket noi lai${reconnectAttempt > 0 ? ` (${reconnectAttempt})` : ''}`;
        }

        if (connectionState === 'disconnected') {
            return 'Dang offline';
        }

        if (isOtherUserOnline) {
            return 'Dang hoat dong';
        }

        if (otherUserLastSeenAt) {
            return `Hoat dong luc ${formatTime(otherUserLastSeenAt)}`;
        }

        return 'Ngoai tuyen';
    }, [
        isOtherUserTyping,
        connectionState,
        reconnectAttempt,
        isOtherUserOnline,
        otherUserLastSeenAt,
    ]);

    const messageById = useMemo(() => {
        const map = new Map<string, Message>();
        messages.forEach((msg) => map.set(msg.id, msg));
        return map;
    }, [messages]);

    const displayMessages = useMemo(
        () =>
            messages.map((msg) => {
                if (!msg.replyToMessageId || msg.replyToMessageText) {
                    return msg;
                }

                const replyTarget = messageById.get(msg.replyToMessageId);
                return {
                    ...msg,
                    replyToMessageText:
                        replyTarget?.text ||
                        replyTarget?.fileName ||
                        'Tin nhan',
                };
            }),
        [messages, messageById],
    );

    React.useEffect(() => {
        if (!params.focusMessageId || displayMessages.length === 0) {
            return;
        }

        const index = displayMessages.findIndex(
            (message) => message.id === params.focusMessageId,
        );
        if (index < 0) {
            return;
        }

        requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.45,
            });
        });
    }, [displayMessages, params.focusMessageId]);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            const bootstrapChatMeta = async () => {
                if (!id) {
                    return;
                }

                try {
                    const status = await chatApi.getBlockStatus(id);
                    if (isMounted) {
                        setBlockStatus(status);
                    }
                } catch {
                    if (isMounted) {
                        setBlockStatus(null);
                    }
                }

                try {
                    const userId = currentUserId || (await getCurrentUserId());
                    if (!userId) {
                        return;
                    }

                    if (!currentUserId) {
                        dispatch(setCurrentUserId(userId));
                    }

                    await dispatch(
                        fetchConversations({
                            userId,
                            refresh: true,
                        }),
                    );
                } catch {
                    // Danh sach forward co the load fail tam thoi, khong chan luong chat.
                }
            };

            void bootstrapChatMeta();

            return () => {
                isMounted = false;
                clearReply();
            };
        }, [clearReply, currentUserId, dispatch, id]),
    );

    const isSendingBlocked = Boolean(blockStatus?.isBlocked);
    const blockReasonText = blockStatus?.iAmTheBlocker
        ? 'Ban da chan cuoc tro chuyen nay. Hay bo chan trong trang thong tin de tiep tuc nhan tin.'
        : blockStatus?.iAmBlocked
          ? 'Ban dang bi chan trong cuoc tro chuyen nay.'
          : 'Cuoc tro chuyen dang bi chan.';

    const replyPayload = useMemo(() => {
        if (!replyingMessage?.id) {
            return undefined;
        }

        return {
            replyToMessageId: replyingMessage.id,
            replyToMessageText:
                replyingMessage.text || replyingMessage.fileName || 'Tin nhan',
        };
    }, [replyingMessage]);

    const handleSend = useCallback(async () => {
        if (isSendingBlocked) {
            Alert.alert('Thong bao', blockReasonText);
            clearReply();
            return;
        }

        try {
            await Promise.resolve(sendMessage(inputText, replyPayload));
        } finally {
            clearReply();
            setTimeout(
                () => listRef.current?.scrollToEnd({ animated: true }),
                100,
            );
        }
    }, [
        blockReasonText,
        clearReply,
        inputText,
        isSendingBlocked,
        replyPayload,
        sendMessage,
    ]);

    const handleAttach = useCallback(
        async (asset: AttachmentAsset) => {
            if (isSendingBlocked) {
                Alert.alert('Thong bao', blockReasonText);
                clearReply();
                return;
            }

            try {
                await sendAttachment(asset, replyPayload);
            } finally {
                clearReply();
            }
        },
        [
            blockReasonText,
            clearReply,
            isSendingBlocked,
            replyPayload,
            sendAttachment,
        ],
    );

    const handleLongPressMessage = useCallback((message: Message) => {
        setActionMessage(message);
        setIsActionSheetVisible(true);
    }, []);

    const handleCopy = useCallback(async (message: Message) => {
        if (!message.text) {
            return;
        }

        await Clipboard.setStringAsync(message.text);
    }, []);

    const handleReact = useCallback(
        (message: Message, emoji: string) => {
            reactToMessage(message.id, emoji);
        },
        [reactToMessage],
    );

    const forwardTargets = useMemo(
        () =>
            conversations.filter(
                (conversation) => conversation.conversationId !== id,
            ),
        [conversations, id],
    );

    const handleForward = useCallback((message: Message) => {
        setIsActionSheetVisible(false);
        setForwardingMessage(message);

        // Cho action sheet dong xong roi moi mo modal forward de tranh bi de touch.
        setTimeout(() => {
            setIsForwardModalVisible(true);
        }, 180);
    }, []);

    const handleSelectForwardTarget = useCallback(
        async (conversation: ConversationResponse) => {
            if (!forwardingMessage) {
                return;
            }

            try {
                setIsForwarding(true);
                await chatApi.sendMessage(
                    buildForwardPayload(
                        forwardingMessage,
                        conversation.conversationId,
                    ),
                );

                setIsForwardModalVisible(false);
                setForwardingMessage(null);
                Alert.alert('Thong bao', 'Da chuyen tiep tin nhan thanh cong.');
            } catch (error) {
                Alert.alert(
                    'Chuyen tiep tin nhan',
                    error instanceof Error
                        ? error.message
                        : 'Khong the chuyen tiep tin nhan',
                );
            } finally {
                setIsForwarding(false);
            }
        },
        [forwardingMessage],
    );

    const shouldShowTimestamp = useCallback(
        (list: Message[], index: number): boolean => {
            if (index === 0) return true;

            const prev = list[index - 1];
            const curr = list[index];

            const diffMinutes = getDiffMinutes(prev.timestamp, curr.timestamp);
            return diffMinutes > 30;
        },
        [],
    );

    const shouldShowDateSeparator = useCallback(
        (list: Message[], index: number): boolean => {
            if (index === 0) return true;

            const prev = list[index - 1];
            return (
                getDateKey(prev.timestamp) !== getDateKey(list[index].timestamp)
            );
        },
        [],
    );

    const renderItem = useCallback(
        ({ item, index }: { item: Message; index: number }) => {
            const hasDateSeparator = shouldShowDateSeparator(
                displayMessages,
                index,
            );
            const hasTimestamp = shouldShowTimestamp(displayMessages, index);

            return (
                <View
                    style={{
                        marginTop: hasDateSeparator ? 8 : 2,
                    }}
                >
                    {hasDateSeparator ? (
                        <MessageDateSeparator
                            label={getDayLabel(item.timestamp)}
                        />
                    ) : null}

                    {hasTimestamp && (
                        <MessageTimestamp
                            time={formatMessageClock(item.timestamp)}
                        />
                    )}

                    <SwipeToReplyRow
                        onReply={() => setReplyingMessage(item)}
                        enabled
                    >
                        <Pressable
                            onLongPress={() => handleLongPressMessage(item)}
                            delayLongPress={220}
                        >
                            <MessageBubble
                                message={item}
                                showAvatar={shouldShowAvatar(
                                    displayMessages,
                                    index,
                                )}
                                avatarUri={avatarUri}
                                senderName={name}
                            />
                        </Pressable>
                    </SwipeToReplyRow>
                </View>
            );
        },
        [
            avatarUri,
            displayMessages,
            handleLongPressMessage,
            name,
            setReplyingMessage,
            shouldShowDateSeparator,
            shouldShowTimestamp,
        ],
    );

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: colors.background }}
            edges={['top']}
        >
            <StatusBar
                barStyle={
                    colorScheme === 'dark' ? 'light-content' : 'dark-content'
                }
                backgroundColor={colors.background}
            />

            <ChatHeader
                name={name ?? 'Chat'}
                avatarUri={avatarUri}
                isOnline={isOtherUserOnline}
                subtitle={subtitle}
                onPressMenu={() => {
                    router.push({
                        pathname: '/chat/info',
                        params: {
                            conversationId: id,
                            name: name || 'Chat',
                            avatarUri: avatarUri || '',
                        },
                    });
                }}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <FlashList
                    ref={listRef}
                    data={displayMessages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    estimatedItemSize={90}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingVertical: 12,
                    }}
                    onContentSizeChange={() =>
                        listRef.current?.scrollToEnd({ animated: true })
                    }
                />

                {isSendingBlocked ? (
                    <View
                        style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            backgroundColor: colors.backgroundSecondary,
                            borderTopWidth: 0.5,
                            borderTopColor: colors.divider,
                        }}
                    >
                        <Text
                            style={{
                                color: colors.textSecondary,
                                fontSize: 12,
                            }}
                        >
                            {blockReasonText}
                        </Text>
                    </View>
                ) : null}

                <MessageInput
                    value={inputText}
                    onChangeText={setInputText}
                    onSend={handleSend}
                    onAttach={handleAttach}
                    disabled={isSendingBlocked}
                    disabledReason={blockReasonText}
                    replyPreviewText={
                        replyingMessage
                            ? replyingMessage.text ||
                              replyingMessage.fileName ||
                              'Tin nhan'
                            : undefined
                    }
                    onCancelReply={clearReply}
                />
            </KeyboardAvoidingView>

            <MessageActionSheet
                visible={isActionSheetVisible}
                message={actionMessage}
                onClose={() => setIsActionSheetVisible(false)}
                onReply={(message) => {
                    setReplyingMessage(message);
                    setIsActionSheetVisible(false);
                }}
                onCopy={handleCopy}
                onReact={(message, emoji) => {
                    handleReact(message, emoji);
                    setIsActionSheetVisible(false);
                }}
                onForward={(message) => {
                    handleForward(message);
                }}
                onDeleteForMe={(message) => {
                    deleteMessageForMe(message.id);
                    setIsActionSheetVisible(false);
                }}
                onRecall={(message) => {
                    recallMessage(message.id);
                    setIsActionSheetVisible(false);
                }}
            />

            <Modal
                visible={isForwardModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setIsForwardModalVisible(false)}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        justifyContent: 'flex-end',
                    }}
                    onPress={() => setIsForwardModalVisible(false)}
                >
                    <Pressable
                        style={{
                            backgroundColor: colors.background,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            height: '72%',
                            minHeight: 360,
                            paddingTop: 14,
                            paddingBottom: 8,
                        }}
                        onPress={(event) => event.stopPropagation()}
                    >
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 16,
                                fontWeight: '700',
                                paddingHorizontal: 16,
                                marginBottom: 10,
                            }}
                        >
                            Chuyen tiep den
                        </Text>

                        {forwardTargets.length === 0 ? (
                            <View
                                style={{
                                    flex: 1,
                                    paddingHorizontal: 16,
                                    paddingVertical: 20,
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: colors.textSecondary }}>
                                    Chua co cuoc tro chuyen nao de chuyen tiep.
                                </Text>
                            </View>
                        ) : (
                            <FlashList
                                data={forwardTargets}
                                keyExtractor={(item) => item.conversationId}
                                estimatedItemSize={74}
                                style={{ flex: 1 }}
                                contentContainerStyle={{ paddingBottom: 12 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        disabled={isForwarding}
                                        onPress={() => {
                                            void handleSelectForwardTarget(
                                                item,
                                            );
                                        }}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                            borderBottomWidth: 0.5,
                                            borderBottomColor: colors.divider,
                                            opacity: isForwarding ? 0.55 : 1,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: colors.text,
                                                fontSize: 15,
                                                fontWeight: '600',
                                            }}
                                            numberOfLines={1}
                                        >
                                            {resolveConversationName(
                                                item,
                                                currentUserId || '',
                                            )}
                                        </Text>
                                        <Text
                                            style={{
                                                color: colors.textSecondary,
                                                fontSize: 12,
                                                marginTop: 2,
                                            }}
                                            numberOfLines={1}
                                        >
                                            {item.lastMessage?.content ||
                                                'Bat dau tro chuyen'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}

                        {isForwarding ? (
                            <View
                                style={{
                                    paddingHorizontal: 16,
                                    paddingTop: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <Text
                                    style={{
                                        color: colors.textSecondary,
                                        fontSize: 12,
                                    }}
                                >
                                    Dang chuyen tiep...
                                </Text>
                            </View>
                        ) : null}
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
