import ChatListItem from '@/components/chat/ChatListItem';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import ChatTabFilter, { ChatTab } from '@/components/chat/ChatTabFilter';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useGroupCreation } from '@/hooks/useGroupCreation';
import { ChatItem } from '@/types/chat';
import { chatApi, ConversationResponse } from '@/services/api/chat';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StatusBar,
    View,
    ActivityIndicator,
    Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

/**
 * Chuyển đổi ConversationResponse thành ChatItem
 */
const convertConversationToChatItem = (
    conversation: ConversationResponse,
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
        unread: 0, // TODO: Lấy từ API nếu có
        isGroup,
        isMuted: conversation.myIsHidden || false,
        isSentByMe:
            lastMessage?.senderId === conversation.participants[0]?.userId ||
            false,
        isRead: true,
        avatarUri,
        avatarUris,
    };
};

export default function ChatsScreen() {
    const { colors, colorScheme } = useTheme();
    const { state: authState } = useAuth();
    const { modalVisible, openModal, closeModal, handleGroupCreated } =
        useGroupCreation();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<ChatTab>('all');
    const [conversations, setConversations] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                convertConversationToChatItem,
            );

            // SORT: Conversations with latest message first
            const sortedItems = chatItems.sort((a, b) => {
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
            setError(errorMessage);
            console.error('Error loading conversations:', err);
            setLoading(false);
        }
    }, [authState.user]);

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

            {/* Search bar with QR + menu */}
            <ChatSearchBar
                value={search}
                onChangeText={setSearch}
                onCreateGroupPress={openModal}
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
                    renderItem={({ item }) => <ChatListItem item={item} />}
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
        </SafeAreaView>
    );
}
