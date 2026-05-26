import ChatListItem from '@/components/chat/ChatListItem';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import ChatTabFilter, { ChatTab } from '@/components/chat/ChatTabFilter';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import AddFriendsModal from '@/components/chat/AddFriendsModal';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useGroupCreation } from '@/hooks/useGroupCreation';
import { ChatItem } from '@/types/chat';
import { chatApi, ConversationResponse } from '@/services/api/chat';
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useNotificationContext } from '@/context/NotificationContext';
import {
    FlatList,
    StatusBar,
    View,
    ActivityIndicator,
    Text,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

/**
 * Chuyển đổi ConversationResponse thành ChatItem
 */
const convertConversationToChatItem = (
    conversation: ConversationResponse,
    currentUserId?: string,
    unreadByConversation: Record<string, number> = {},
): ChatItem => {
    const lastMessage = conversation.lastMessage;

    const isGroup = conversation.type === 'GROUP';

    // Lấy thông tin người dùng khác (cho private chat)
    const otherParticipant = !isGroup
        ? conversation.participants.find(
              (p: any) => p.userId !== conversation.participants[0]?.userId,
          )
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

    return {
        id: conversation.conversationId,
        name,
        lastMessage: lastMessage?.content || 'No messages yet',
        time: formatTime(lastMessage?.createdAt || lastMessage?.timestamp),
        unread: unreadByConversation[conversation.conversationId] || 0,
        isGroup,
        isMuted: conversation.myIsHidden || false,
        isPinned: conversation.myIsPinned || false,
        pinnedAt: conversation.myPinnedAt || undefined,
        isSentByMe: !!currentUserId && lastMessage?.senderId === currentUserId,
        isRead: true,
        avatarUri,
        avatarUris,
    };
};

export default function ChatsScreen() {
    const { colors, colorScheme } = useTheme();
    const { state: authState } = useAuth();
    const router = useRouter();
    const { unreadByConversation } = useNotificationContext();
    const { modalVisible, openModal, closeModal, handleGroupCreated } =
        useGroupCreation();
    const [addFriendsVisible, setAddFriendsVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<ChatTab>('all');
    const [conversations, setConversations] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const openedSwipeableRef = useRef<Swipeable | null>(null);

    const loadConversations = useCallback(async () => {
        if (!authState.user?.userId) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const data = await chatApi.getConversations(
                authState.user!.userId,
                20,
                0,
            );
            // Deduplicate conversations by ID (prevent duplicates from backend or polling)
            const uniqueConversations = new Map<string, any>();
            data.forEach((conv) => {
                if (!uniqueConversations.has(conv.conversationId)) {
                    uniqueConversations.set(conv.conversationId, conv);
                }
            });
            const chatItems = Array.from(uniqueConversations.values()).map(
                (conversation) =>
                    convertConversationToChatItem(
                        conversation,
                        authState.user?.userId,
                        unreadByConversation,
                    ),
            );

            // SORT: pinned conversations first, then latest message first
            const sortedItems = chatItems.sort((a, b) => {
                if (!!a.isPinned !== !!b.isPinned) {
                    return a.isPinned ? -1 : 1;
                }

                if (a.isPinned && b.isPinned) {
                    return (
                        new Date(b.pinnedAt || 0).getTime() -
                        new Date(a.pinnedAt || 0).getTime()
                    );
                }

                const timeA = a.time ? new Date(a.time).getTime() : 0;
                const timeB = b.time ? new Date(b.time).getTime() : 0;
                return timeB - timeA; // Newest first
            });

            setConversations(sortedItems);
            setLoading(false);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to load conversations';
            const lowerMessage = errorMessage.toLowerCase();
            const isSessionConflict =
                lowerMessage.includes('phiên làm việc') ||
                lowerMessage.includes('phien lam viec') ||
                lowerMessage.includes('unauthorized') ||
                (lowerMessage.includes('statuscode') &&
                    lowerMessage.includes('401'));

            if (!isSessionConflict) {
                setError(errorMessage);
            }
            console.error('Error loading conversations:', err);
            setLoading(false);
        }
    }, [authState.user, unreadByConversation]);

    // Load khi component mount
    useEffect(() => {
        if (!authState.user?.userId) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        setLoading(true);
        loadConversations();
    }, [authState.user?.userId, loadConversations]);

    // Polling: Refetch mỗi 5 giây
    useEffect(() => {
        if (!authState.user?.userId) return;

        const interval = setInterval(() => {
            loadConversations();
        }, 5000);

        return () => clearInterval(interval);
    }, [authState.user?.userId, loadConversations]);

    // Refetch khi app gain focus
    useFocusEffect(
        useCallback(() => {
            if (authState.user?.userId) {
                loadConversations();
            }
        }, [authState.user?.userId, loadConversations]),
    );

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

    const handleTogglePinConversation = useCallback(async (item: ChatItem) => {
        const nextPinned = !item.isPinned;
        const nextPinnedAt = nextPinned ? new Date().toISOString() : undefined;

        setConversations((prev) =>
            prev
                .map((conversation) =>
                    conversation.id === item.id
                        ? {
                              ...conversation,
                              isPinned: nextPinned,
                              pinnedAt: nextPinnedAt,
                          }
                        : conversation,
                )
                .sort((a, b) => {
                    if (!!a.isPinned !== !!b.isPinned) {
                        return a.isPinned ? -1 : 1;
                    }
                    if (a.isPinned && b.isPinned) {
                        return (
                            new Date(b.pinnedAt || 0).getTime() -
                            new Date(a.pinnedAt || 0).getTime()
                        );
                    }
                    return 0;
                }),
        );

        try {
            if (nextPinned) {
                await chatApi.pinConversation(item.id);
            } else {
                await chatApi.unpinConversation(item.id);
            }
            await loadConversations();
        } catch (err) {
            Alert.alert(
                'Không thể cập nhật ghim',
                err instanceof Error ? err.message : 'Vui lòng thử lại sau',
            );
            await loadConversations();
        }
    }, [loadConversations]);

    const handleClearConversationHistory = useCallback((item: ChatItem) => {
        Alert.alert(
            'Xóa lịch sử',
            `Xóa lịch sử hội thoại với ${item.name}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await chatApi.clearConversationHistory(item.id);
                            await loadConversations();
                        } catch (err) {
                            Alert.alert(
                                'Không thể xóa lịch sử',
                                err instanceof Error
                                    ? err.message
                                    : 'Vui lòng thử lại sau',
                            );
                        }
                    },
                },
            ],
        );
    }, [loadConversations]);

    const handleDeleteConversation = useCallback((item: ChatItem) => {
        Alert.alert('Xóa hội thoại', `Xóa hội thoại với ${item.name}?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await chatApi.deleteConversation(item.id);
                        setConversations((prev) =>
                            prev.filter(
                                (conversation) => conversation.id !== item.id,
                            ),
                        );
                    } catch (err) {
                        Alert.alert(
                            'Không thể xóa',
                            err instanceof Error
                                ? err.message
                                : 'Vui lòng thử lại sau',
                        );
                    }
                },
            },
        ]);
    }, []);

    const handleSwipeOpen = useCallback((_: string, ref: Swipeable | null) => {
        if (openedSwipeableRef.current && openedSwipeableRef.current !== ref) {
            openedSwipeableRef.current.close();
        }
        openedSwipeableRef.current = ref;
    }, []);

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
            <ChatSearchBar
                value={search}
                onChangeText={setSearch}
                onCreateGroupPress={openModal}
                onAddFriendsPress={() => setAddFriendsVisible(true)}
            />

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

            {/* Create Group Modal */}
            <CreateGroupModal
                visible={modalVisible}
                onClose={closeModal}
                onGroupCreated={handleGroupCreated}
            />
            <AddFriendsModal
                visible={addFriendsVisible}
                currentUserId={authState.user?.userId}
                onClose={() => setAddFriendsVisible(false)}
            />
        </SafeAreaView>
    );
}
