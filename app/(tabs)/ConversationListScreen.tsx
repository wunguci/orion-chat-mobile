import ChatListItem from '@/components/chat/ChatListItem';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import ChatTabFilter, { ChatTab } from '@/components/chat/ChatTabFilter';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useTheme } from '@/hooks/useTheme';
import { ConversationResponse } from '@/services/api/chat';
import { openOrCreateConversation } from '@/services/chat/conversationNavigation';
import { chatSocketService } from '@/services/websocket/chatSocket';
import {
    fetchConversations,
    patchConversationFromSocket,
    setCurrentUserId,
} from '@/store/slices/chatSlice';
import { ChatItem } from '@/types/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatConversationTime(iso?: string): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const now = new Date();
    const isToday =
        now.getDate() === date.getDate() &&
        now.getMonth() === date.getMonth() &&
        now.getFullYear() === date.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
    });
}

function getUnreadCount(conversation: ConversationResponse): number {
    const data = conversation as ConversationResponse & {
        unreadCount?: number;
        unreadMessages?: number;
        unread?: number;
    };

    return Math.max(
        0,
        data.unreadCount || data.unreadMessages || data.unread || 0,
    );
}

function toChatItem(
    conversation: ConversationResponse,
    currentUserId: string,
): ChatItem {
    const otherParticipants = conversation.participants.filter(
        (p) => p.userId !== currentUserId,
    );

    const privateTarget = otherParticipants[0];
    const groupName = conversation.groupInfo?.groupName as string | undefined;
    const groupAvatar = conversation.groupInfo?.groupAvatar as
        | string
        | undefined;
    const isGroup = conversation.type === 'GROUP';

    const displayName = isGroup
        ? groupName ||
          otherParticipants.map((p) => p.fullName).join(', ') ||
          'Nhom'
        : privateTarget?.fullName || 'Cuoc tro chuyen';

    const lastMessage =
        conversation.lastMessage?.content || 'Bat dau tro chuyen';
    const senderBy = conversation.lastMessage?.senderBy;

    return {
        id: conversation.conversationId,
        name: displayName,
        lastMessage,
        time: formatConversationTime(
            conversation.lastMessage?.createdAt ||
                conversation.lastMessage?.timestamp,
        ),
        unread: getUnreadCount(conversation),
        isGroup,
        isMuted: false,
        isSentByMe: Boolean(senderBy && senderBy === currentUserId),
        isRead: getUnreadCount(conversation) === 0,
        avatarUri: isGroup ? groupAvatar : privateTarget?.avatarUrl,
        avatarUris: isGroup
            ? (otherParticipants
                  .map((p) => p.avatarUrl)
                  .filter(Boolean)
                  .slice(0, 3) as string[])
            : undefined,
        isPinned: Boolean(conversation.myIsPinned),
    };
}

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
            if (typeof raw === 'string' && raw.trim().length > 0) {
                return raw;
            }
        }
    }

    return null;
}

export default function ConversationListScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { colors, colorScheme } = useTheme();
    const { currentUserId, conversations, isLoading, isRefreshing, error } =
        useAppSelector((state) => state.chat);

    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<ChatTab>('all');

    const loadConversations = useCallback(
        async (refresh = false) => {
            const userId = currentUserId || (await getCurrentUserId());

            if (!userId) {
                throw new Error('Khong tim thay thong tin nguoi dung.');
            }

            if (!currentUserId) {
                dispatch(setCurrentUserId(userId));
            }

            await dispatch(
                fetchConversations({
                    userId,
                    refresh,
                }),
            );
        },
        [currentUserId, dispatch],
    );

    useFocusEffect(
        useCallback(() => {
            loadConversations(false).catch(() => null);
            return undefined;
        }, [loadConversations]),
    );

    const conversationIds = useMemo(
        () => new Set(conversations.map((item) => item.conversationId)),
        [conversations],
    );

    React.useEffect(() => {
        if (!currentUserId || conversations.length === 0) {
            return;
        }

        let isMounted = true;

        const onSocketMessage = (socketData: {
            conversationId: string;
            message: {
                content?: string;
                senderBy?: string;
                createdAt?: string;
            };
        }) => {
            if (!isMounted) {
                return;
            }

            if (!conversationIds.has(socketData.conversationId)) {
                void dispatch(
                    fetchConversations({
                        userId: currentUserId,
                        refresh: true,
                    }),
                );
                return;
            }

            dispatch(
                patchConversationFromSocket({
                    conversationId: socketData.conversationId,
                    content: socketData.message.content,
                    senderBy: socketData.message.senderBy,
                    createdAt: socketData.message.createdAt,
                }),
            );
        };

        conversations.forEach((conversation) => {
            chatSocketService.joinConversation(conversation.conversationId);
            chatSocketService.onMessage(
                conversation.conversationId,
                onSocketMessage,
            );
            chatSocketService.onAck(conversation.conversationId, () => {
                // ACK khong can refresh full list; list da duoc patch tu message_new.
            });
        });

        const offConnection = chatSocketService.onConnectionState((state) => {
            if (state === 'connected') {
                void dispatch(
                    fetchConversations({
                        userId: currentUserId,
                        refresh: true,
                    }),
                );
            }
        });

        return () => {
            isMounted = false;
            offConnection();
            conversations.forEach((conversation) => {
                chatSocketService.leaveConversation(
                    conversation.conversationId,
                );
            });
        };
    }, [conversationIds, conversations, currentUserId, dispatch]);

    const chatItems = useMemo(() => {
        if (!currentUserId) {
            return [];
        }

        return conversations.map((conversation) =>
            toChatItem(conversation, currentUserId),
        );
    }, [conversations, currentUserId]);

    const filteredChats = useMemo(() => {
        let list = chatItems;

        if (activeTab === 'unread') {
            list = list.filter((item) => item.unread > 0);
        }

        if (search.trim()) {
            const keyword = search.trim().toLowerCase();
            list = list.filter(
                (item) =>
                    item.name.toLowerCase().includes(keyword) ||
                    item.lastMessage.toLowerCase().includes(keyword),
            );
        }

        return list;
    }, [activeTab, chatItems, search]);

    const openConversation = useCallback(
        async (item: ChatItem) => {
            await openOrCreateConversation({
                router,
                conversationId: item.id,
                name: item.name,
                avatarUri: item.avatarUri || '',
            });
        },
        [router],
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

            <ChatSearchBar value={search} onChangeText={setSearch} />
            <ChatTabFilter activeTab={activeTab} onTabChange={setActiveTab} />

            {isLoading ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ActivityIndicator color="#00B14F" size="large" />
                </View>
            ) : error ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 24,
                        gap: 10,
                    }}
                >
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: 14,
                            textAlign: 'center',
                        }}
                    >
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            loadConversations(false).catch(() => null);
                        }}
                        style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: '#00B14F',
                        }}
                    >
                        <Text
                            style={{
                                color: '#fff',
                                fontWeight: '700',
                            }}
                        >
                            Thu lai
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : filteredChats.length === 0 ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 24,
                    }}
                >
                    <Text
                        style={{
                            color: colors.textSecondary,
                            fontSize: 14,
                            textAlign: 'center',
                        }}
                    >
                        Chua co cuoc tro chuyen nao.
                    </Text>
                </View>
            ) : (
                <FlashList
                    data={filteredChats}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChatListItem
                            item={item}
                            onPress={() => {
                                void openConversation(item);
                            }}
                        />
                    )}
                    estimatedItemSize={78}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => (
                        <View
                            style={{
                                height: 0.5,
                                marginLeft: 80,
                                backgroundColor: colors.divider,
                            }}
                        />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => {
                                loadConversations(true).catch(() => null);
                            }}
                            colors={['#00B14F']}
                            tintColor="#00B14F"
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}
