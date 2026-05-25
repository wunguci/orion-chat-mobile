import ChatListItem from '@/components/chat/ChatListItem';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import ChatTabFilter, { ChatTab } from '@/components/chat/ChatTabFilter';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { ChatItem } from '@/types/chat';
import { chatApi, ConversationResponse } from '@/services/api/chat';
import { chatSocketService } from '@/services/websocket/chatSocket';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
    FlatList,
    StatusBar,
    View,
    ActivityIndicator,
    Text,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';

/**
 * Chuyển đổi ConversationResponse thành ChatItem
 */
const convertConversationToChatItem = (
    conversation: ConversationResponse,
    currentUserId?: string,
): ChatItem => {
    const lastMessage = conversation.lastMessage;

    const isGroup = conversation.type === 'GROUP';

    // Lấy thông tin người dùng khác (cho private chat)
    const otherParticipant = !isGroup
        ? conversation.participants.find((p: any) => p.userId !== currentUserId)
        : null;

    // Xác định tên hiển thị
    const name = isGroup
        ? conversation.groupInfo?.groupName || 'Group'
        : otherParticipant?.fullName || 'Unknown';

    // Xác định avatars
    const avatarUri = !isGroup
        ? otherParticipant?.avatarUrl
        : conversation.groupInfo?.groupAvatar;

    const avatarUris = isGroup
        ? conversation.participants
              .slice(0, 3)
              .map((p: any) => p.avatarUrl)
              .filter(Boolean)
        : undefined;

    // Format thời gian tin nhắn cuối cùng
    const formatTime = (timestamp?: string) => {
        if (!timestamp) return '';

        const msgDate = new Date(timestamp);
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const msgDay = new Date(
            msgDate.getFullYear(),
            msgDate.getMonth(),
            msgDate.getDate(),
        );

        if (msgDay.getTime() === today.getTime()) {
            return msgDate.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
        } else if (msgDay.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else if (now.getFullYear() === msgDate.getFullYear()) {
            return msgDate.toLocaleDateString('vi-VN', {
                month: '2-digit',
                day: '2-digit',
            });
        } else {
            return msgDate.toLocaleDateString('vi-VN');
        }
    };

    console.log('[Index] Conversation last message ', conversation.lastMessage);

    return {
        id: conversation.conversationId,
        name,
        lastMessage: lastMessage?.content || 'No messages yet',
        time: formatTime(lastMessage?.createdAt || lastMessage?.timestamp),
        unread: 0, // TODO: Lấy từ API nếu có
        isGroup,
        isMuted: conversation.myIsHidden || false,
        isPinned: conversation.myIsPinned || false,
        pinnedAt: conversation.myPinnedAt || undefined,
        isSentByMe:
            lastMessage?.senderId === conversation.participants[0]?.userId ||
            false,
        isRead: true,
        avatarUri,
        avatarUris,
        otherUserId: otherParticipant?.userId,
        participantIds: conversation.participants
            .map((participant) => participant.userId)
            .filter((userId) => userId !== currentUserId),
    };
};

export default function ChatsScreen() {
    const { colors, colorScheme } = useTheme();
    const { state: authState } = useAuth();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<ChatTab>('all');
    const [conversations, setConversations] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const openedSwipeableRef = useRef<Swipeable | null>(null);

    // Fetch conversations when component mounts
    useEffect(() => {
        if (!authState.user?.userId) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        const loadConversations = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await chatApi.getConversations(
                    authState.user!.userId,
                    20,
                    0,
                );
                const chatItems = data.map((conversation) =>
                    convertConversationToChatItem(
                        conversation,
                        authState.user?.userId,
                    ),
                );
                setConversations(chatItems);
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load conversations';
                const lowerMessage = errorMessage.toLowerCase();
                const isSessionConflict =
                    lowerMessage.includes('phien lam viec') ||
                    lowerMessage.includes('unauthorized') ||
                    (lowerMessage.includes('statuscode') &&
                        lowerMessage.includes('401'));

                if (!isSessionConflict) {
                    setError(errorMessage);
                }

                console.error('Error loading conversations:', err);
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, [authState.user]);

    useEffect(() => {
        const handleConversationDeleted = (payload: {
            conversationId?: string;
        }) => {
            if (!payload?.conversationId) return;
            setConversations((prev) =>
                prev.filter((item) => item.id !== payload.conversationId),
            );
        };

        let isMounted = true;
        void chatSocketService
            .connect()
            .then(() => {
                if (isMounted) {
                    chatSocketService.onConversationDeleted(
                        handleConversationDeleted,
                    );
                }
            })
            .catch(() => undefined);

        return () => {
            isMounted = false;
            chatSocketService.offConversationDeleted(handleConversationDeleted);
        };
    }, []);

    const handleDeleteConversation = (item: ChatItem) => {
        Alert.alert(
            'Xoa hoi thoai',
            item.isGroup
                ? 'Hien tai thao tac nay chi ap dung cho hoi thoai 1-1. Ban co muon thu xoa khoi danh sach khong?'
                : `Xoa hoi thoai voi ${item.name}?`,
            [
                { text: 'Huy', style: 'cancel' },
                {
                    text: 'Xoa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await chatApi.deleteConversation(item.id);
                            setConversations((prev) =>
                                prev.filter(
                                    (conversation) =>
                                        conversation.id !== item.id,
                                ),
                            );
                        } catch (err) {
                            Alert.alert(
                                'Khong the xoa',
                                err instanceof Error
                                    ? err.message
                                    : 'Vui long thu lai sau',
                            );
                        }
                    },
                },
            ],
        );
    };

    const handleTogglePinConversation = async (item: ChatItem) => {
        const nextPinned = !item.isPinned;
        setConversations((prev) =>
            prev.map((conversation) =>
                conversation.id === item.id
                    ? {
                          ...conversation,
                          isPinned: nextPinned,
                          pinnedAt: nextPinned
                              ? new Date().toISOString()
                              : undefined,
                      }
                    : conversation,
            ),
        );

        try {
            if (nextPinned) {
                await chatApi.pinConversation(item.id);
            } else {
                await chatApi.unpinConversation(item.id);
            }
        } catch (err) {
            Alert.alert(
                'Khong the cap nhat ghim',
                err instanceof Error ? err.message : 'Vui long thu lai sau',
            );
            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation.id === item.id
                        ? {
                              ...conversation,
                              isPinned: item.isPinned,
                              pinnedAt: item.pinnedAt,
                          }
                        : conversation,
                ),
            );
        }
    };

    const handleClearConversationHistory = (item: ChatItem) => {
        Alert.alert('Xoa lich su', `Xoa lich su hoi thoai voi ${item.name}?`, [
            { text: 'Huy', style: 'cancel' },
            {
                text: 'Xoa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await chatApi.clearConversationHistory(item.id);
                        setConversations((prev) =>
                            prev.map((conversation) =>
                                conversation.id === item.id
                                    ? {
                                          ...conversation,
                                          lastMessage: 'No messages yet',
                                      }
                                    : conversation,
                            ),
                        );
                    } catch (err) {
                        Alert.alert(
                            'Khong the xoa lich su',
                            err instanceof Error
                                ? err.message
                                : 'Vui long thu lai sau',
                        );
                    }
                },
            },
        ]);
    };

    const handleSwipeOpen = useCallback((_: string, ref: Swipeable | null) => {
        if (openedSwipeableRef.current && openedSwipeableRef.current !== ref) {
            openedSwipeableRef.current.close();
        }
        openedSwipeableRef.current = ref;
    }, []);

    const filteredChats = useMemo(() => {
        let list = conversations;

        if (activeTab === 'unread') {
            list = list.filter((c) => c.unread > 0);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.lastMessage.toLowerCase().includes(q),
            );
        }

        return list;
    }, [search, activeTab, conversations]);

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: colors.background }}
            edges={[]}
        >
            <StatusBar
                barStyle={
                    colorScheme === 'dark' ? 'light-content' : 'dark-content'
                }
                backgroundColor={colors.background}
            />

            {/* Search bar with QR + menu */}
            <ChatSearchBar value={search} onChangeText={setSearch} />

            {/* Tab filter */}
            <ChatTabFilter activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Loading state */}
            {loading && (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}

            {/* Error state */}
            {error && !loading && (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                    }}
                >
                    <Text
                        style={{
                            color: colors.error,
                            textAlign: 'center',
                            fontSize: 16,
                        }}
                    >
                        {error}
                    </Text>
                </View>
            )}

            {/* Empty state */}
            {!loading && !error && filteredChats.length === 0 && (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: colors.text, fontSize: 16 }}>
                        {search
                            ? 'No conversations found'
                            : 'No conversations yet'}
                    </Text>
                </View>
            )}

            {/* Chat list */}
            {!loading && !error && filteredChats.length > 0 && (
                <FlatList
                    data={filteredChats}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChatListItem
                            item={item}
                            onLongPress={handleDeleteConversation}
                            onTogglePin={handleTogglePinConversation}
                            onClearHistory={handleClearConversationHistory}
                            onDelete={handleDeleteConversation}
                            onSwipeOpen={handleSwipeOpen}
                        />
                    )}
                    ItemSeparatorComponent={() => (
                        <View
                            style={{
                                height: 0.5,
                                marginLeft: 80,
                                backgroundColor: colors.divider,
                            }}
                        />
                    )}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}
