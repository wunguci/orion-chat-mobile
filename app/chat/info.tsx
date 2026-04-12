import { useTheme } from '@/hooks/useTheme';
import {
    chatApi,
    ConversationResponse,
    MessageItem,
} from '@/services/api/chat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MediaTab = 'images' | 'files' | 'links';
type SenderFilter = 'all' | 'me' | 'others';
type TimeFilter = 'all' | '7d' | '30d' | '90d';

type MediaContextAction = 'open' | 'jump' | 'deleteForMe' | 'recall';

type BlockStatus = {
    isBlocked: boolean;
    iAmBlocked: boolean;
    iAmTheBlocker: boolean;
    blockedAt?: string;
};

const getCurrentUserId = async (): Promise<string | null> => {
    const candidates = ['auth_user', 'user', 'current_user', 'userId'];

    for (const key of candidates) {
        try {
            const raw = await AsyncStorage.getItem(key);
            if (!raw) continue;

            try {
                const parsed = JSON.parse(raw);
                const id = parsed?.id || parsed?.userId;
                if (id) {
                    return String(id);
                }
            } catch {
                if (key === 'userId') {
                    return raw;
                }
            }
        } catch {
            continue;
        }
    }

    return null;
};

const getDayLabel = (isoDate?: string) => {
    const date = new Date(isoDate || '');
    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
};

const isWithinTimeFilter = (timestamp?: string, filter: TimeFilter) => {
    if (filter === 'all') return true;

    const value = new Date(timestamp || '');
    if (Number.isNaN(value.getTime())) return false;

    const now = Date.now();
    const diff = now - value.getTime();

    if (filter === '7d') return diff <= 7 * 24 * 60 * 60 * 1000;
    if (filter === '30d') return diff <= 30 * 24 * 60 * 60 * 1000;
    return diff <= 90 * 24 * 60 * 60 * 1000;
};

function MediaActionSheet({
    visible,
    onClose,
    onAction,
}: {
    visible: boolean;
    onClose: () => void;
    onAction: (action: MediaContextAction) => void;
}) {
    const { colors } = useTheme();

    const actionRows: { label: string; value: MediaContextAction }[] = [
        { label: 'Open', value: 'open' },
        { label: 'Jump to message', value: 'jump' },
        { label: 'Delete for me', value: 'deleteForMe' },
        { label: 'Recall', value: 'recall' },
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    justifyContent: 'flex-end',
                }}
                onPress={onClose}
            >
                <Pressable
                    style={{
                        backgroundColor: colors.background,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 14,
                        gap: 6,
                    }}
                    onPress={(e) => e.stopPropagation()}
                >
                    {actionRows.map((row) => (
                        <TouchableOpacity
                            key={row.value}
                            style={{
                                paddingVertical: 12,
                                paddingHorizontal: 10,
                                borderRadius: 10,
                                backgroundColor: colors.backgroundSecondary,
                            }}
                            onPress={() => {
                                onAction(row.value);
                                onClose();
                            }}
                        >
                            <Text style={{ color: colors.text, fontSize: 15 }}>
                                {row.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

export default function ConversationInfoScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const params = useLocalSearchParams<{
        conversationId?: string;
        name?: string;
        avatarUri?: string;
    }>();

    const conversationId = params.conversationId || '';

    const [activeTab, setActiveTab] = useState<MediaTab>('images');
    const [senderFilter, setSenderFilter] = useState<SenderFilter>('all');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [conversation, setConversation] =
        useState<ConversationResponse | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPinned, setIsPinned] = useState(false);
    const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(
        null,
    );
    const [isMediaActionVisible, setIsMediaActionVisible] = useState(false);

    const loadData = useCallback(async () => {
        if (!conversationId) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const userId = await getCurrentUserId();
            setCurrentUserId(userId || '');

            const [detail, messageResult, status] = await Promise.all([
                chatApi.getConversation(conversationId),
                chatApi.getMessages(conversationId, 200, 0),
                chatApi.getBlockStatus(conversationId).catch(() => null),
            ]);

            setConversation(detail);
            setMessages(messageResult?.items || []);
            setIsPinned(Boolean(detail?.myIsPinned));
            if (status) {
                setBlockStatus(status);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Khong the tai thong tin hoi thoai',
            );
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const participants = conversation?.participants || [];

    const mediaItems = useMemo(() => {
        let result = messages.filter((msg) => {
            const type = String(msg.messageType || '').toUpperCase();
            const content = msg.content || '';

            if (activeTab === 'images') {
                return type === 'IMAGE' && Boolean(msg.mediaUrl);
            }

            if (activeTab === 'files') {
                return (
                    (type === 'FILE' || type === 'VIDEO' || type === 'AUDIO') &&
                    Boolean(msg.mediaUrl)
                );
            }

            return /https?:\/\/|www\./i.test(content);
        });

        if (senderFilter === 'me') {
            result = result.filter((msg) => msg.senderBy === currentUserId);
        } else if (senderFilter === 'others') {
            result = result.filter((msg) => msg.senderBy !== currentUserId);
        }

        result = result.filter((msg) =>
            isWithinTimeFilter(msg.createdAt, timeFilter),
        );

        return result.sort(
            (a, b) =>
                new Date(b.createdAt || '').getTime() -
                new Date(a.createdAt || '').getTime(),
        );
    }, [activeTab, currentUserId, messages, senderFilter, timeFilter]);

    const groupedMedia = useMemo(() => {
        const groups = new Map<string, MessageItem[]>();

        mediaItems.forEach((item) => {
            const key = getDayLabel(item.createdAt);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)?.push(item);
        });

        return Array.from(groups.entries());
    }, [mediaItems]);

    const conversationTitle =
        conversation?.type === 'GROUP'
            ? conversation?.groupInfo?.groupName ||
              params.name ||
              'Conversation'
            : participants.find((p) => p.userId !== currentUserId)?.fullName ||
              params.name ||
              'Conversation';

    const avatarUri =
        conversation?.groupInfo?.groupAvatar ||
        participants.find((p) => p.userId !== currentUserId)?.avatarUrl ||
        params.avatarUri ||
        '';

    const runConversationAction = useCallback(
        async (
            action: 'pin' | 'block' | 'unblock' | 'clear' | 'autoDelete',
        ) => {
            if (!conversationId) return;

            try {
                if (action === 'pin') {
                    if (isPinned) {
                        await chatApi.unpinConversation(conversationId);
                    } else {
                        await chatApi.pinConversation(conversationId);
                    }
                    setIsPinned((prev) => !prev);
                    return;
                }

                if (action === 'block') {
                    await chatApi.blockUser(conversationId);
                } else if (action === 'unblock') {
                    await chatApi.unblockUser(conversationId);
                } else if (action === 'clear') {
                    await chatApi.clearConversationHistory(conversationId);
                    setMessages([]);
                } else if (action === 'autoDelete') {
                    await chatApi.updateAutoDeleteDuration(conversationId, 7);
                }

                const latestStatus = await chatApi
                    .getBlockStatus(conversationId)
                    .catch(() => null);
                if (latestStatus) {
                    setBlockStatus(latestStatus);
                }
            } catch (err) {
                Alert.alert(
                    'Loi',
                    err instanceof Error ? err.message : 'Action failed',
                );
            }
        },
        [conversationId, isPinned],
    );

    const handleMediaAction = useCallback(
        async (action: MediaContextAction) => {
            if (!selectedMessage || !conversationId) return;

            try {
                if (action === 'open') {
                    const url =
                        selectedMessage.mediaUrl || selectedMessage.content;
                    if (url) {
                        await Linking.openURL(
                            url.startsWith('http') ? url : `https://${url}`,
                        );
                    }
                    return;
                }

                if (action === 'jump') {
                    router.replace({
                        pathname: '/chat/[id]',
                        params: {
                            id: conversationId,
                            name: conversationTitle,
                            avatarUri,
                            focusMessageId: selectedMessage._id,
                        },
                    });
                    return;
                }

                if (action === 'deleteForMe') {
                    await chatApi.deleteMessageForMe(
                        conversationId,
                        selectedMessage._id,
                    );
                    setMessages((prev) =>
                        prev.filter((msg) => msg._id !== selectedMessage._id),
                    );
                    return;
                }

                await chatApi.recallMessageForEveryone(
                    conversationId,
                    selectedMessage._id,
                );
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === selectedMessage._id
                            ? {
                                  ...msg,
                                  content: 'Tin nhan da duoc thu hoi',
                                  mediaUrl: undefined,
                              }
                            : msg,
                    ),
                );
            } catch (err) {
                Alert.alert(
                    'Loi',
                    err instanceof Error
                        ? err.message
                        : 'Khong the xu ly media',
                );
            }
        },
        [avatarUri, conversationId, conversationTitle, router, selectedMessage],
    );

    if (!conversationId) {
        return (
            <SafeAreaView
                style={{ flex: 1, backgroundColor: colors.background }}
            >
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: colors.text }}>
                        Conversation not found.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: colors.background }}
            edges={['top']}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                    gap: 10,
                }}
            >
                <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={colors.text}
                    />
                </TouchableOpacity>

                <Text
                    style={{
                        color: colors.text,
                        fontSize: 17,
                        fontWeight: '700',
                        flex: 1,
                    }}
                >
                    Conversation Info
                </Text>
            </View>

            {loading ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : error ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                >
                    <Text
                        style={{
                            color: colors.error,
                            textAlign: 'center',
                            marginBottom: 12,
                        }}
                    >
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => void loadData()}
                        style={{
                            backgroundColor: colors.primary,
                            borderRadius: 10,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>
                            Reload
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        {avatarUri ? (
                            <Image
                                source={{ uri: avatarUri }}
                                style={{
                                    width: 76,
                                    height: 76,
                                    borderRadius: 38,
                                    marginBottom: 10,
                                }}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 76,
                                    height: 76,
                                    borderRadius: 38,
                                    marginBottom: 10,
                                    backgroundColor: colors.primary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: 24,
                                        fontWeight: '700',
                                    }}
                                >
                                    {(conversationTitle || 'C')
                                        .charAt(0)
                                        .toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text
                            style={{
                                color: colors.text,
                                fontWeight: '700',
                                fontSize: 18,
                            }}
                        >
                            {conversationTitle}
                        </Text>
                    </View>

                    <View style={{ paddingHorizontal: 14, gap: 8 }}>
                        <View
                            style={{
                                backgroundColor: colors.backgroundSecondary,
                                borderRadius: 12,
                                padding: 10,
                                gap: 8,
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                                onPress={() =>
                                    void runConversationAction('pin')
                                }
                            >
                                <Text
                                    style={{ color: colors.text, fontSize: 14 }}
                                >
                                    Pin conversation
                                </Text>
                                <MaterialCommunityIcons
                                    name={
                                        isPinned
                                            ? 'pin-off-outline'
                                            : 'pin-outline'
                                    }
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                                onPress={() =>
                                    void runConversationAction('autoDelete')
                                }
                            >
                                <Text
                                    style={{ color: colors.text, fontSize: 14 }}
                                >
                                    Auto delete (7 days)
                                </Text>
                                <Ionicons
                                    name="time-outline"
                                    size={19}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                                onPress={() =>
                                    void runConversationAction('clear')
                                }
                            >
                                <Text
                                    style={{ color: colors.text, fontSize: 14 }}
                                >
                                    Clear history
                                </Text>
                                <Ionicons
                                    name="trash-outline"
                                    size={19}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                                onPress={() =>
                                    void runConversationAction(
                                        blockStatus?.iAmTheBlocker
                                            ? 'unblock'
                                            : 'block',
                                    )
                                }
                            >
                                <Text
                                    style={{ color: colors.text, fontSize: 14 }}
                                >
                                    {blockStatus?.iAmTheBlocker
                                        ? 'Unblock user'
                                        : 'Block user'}
                                </Text>
                                <Ionicons
                                    name="ban-outline"
                                    size={19}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {blockStatus?.isBlocked ? (
                            <Text
                                style={{ color: colors.warning, fontSize: 12 }}
                            >
                                {blockStatus.iAmBlocked
                                    ? 'You are blocked in this conversation.'
                                    : 'This conversation is currently blocked.'}
                            </Text>
                        ) : null}
                    </View>

                    <View style={{ marginTop: 18 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                paddingHorizontal: 14,
                                gap: 8,
                            }}
                        >
                            {[
                                { key: 'images', label: 'Images' },
                                { key: 'files', label: 'Files' },
                                { key: 'links', label: 'Links' },
                            ].map((tab) => {
                                const selected = activeTab === tab.key;
                                return (
                                    <TouchableOpacity
                                        key={tab.key}
                                        onPress={() =>
                                            setActiveTab(tab.key as MediaTab)
                                        }
                                        style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 999,
                                            backgroundColor: selected
                                                ? colors.primary
                                                : colors.backgroundSecondary,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: selected
                                                    ? '#fff'
                                                    : colors.textSecondary,
                                                fontSize: 12,
                                            }}
                                        >
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                paddingHorizontal: 14,
                                gap: 8,
                                marginTop: 10,
                            }}
                        >
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'me', label: 'Me' },
                                { key: 'others', label: 'Others' },
                            ].map((item) => {
                                const selected = senderFilter === item.key;
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        onPress={() =>
                                            setSenderFilter(
                                                item.key as SenderFilter,
                                            )
                                        }
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 999,
                                            backgroundColor: selected
                                                ? colors.primaryLight
                                                : colors.backgroundSecondary,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: selected
                                                    ? colors.primary
                                                    : colors.textSecondary,
                                                fontSize: 12,
                                            }}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                            {[
                                { key: 'all', label: 'All time' },
                                { key: '7d', label: '7d' },
                                { key: '30d', label: '30d' },
                                { key: '90d', label: '90d' },
                            ].map((item) => {
                                const selected = timeFilter === item.key;
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        onPress={() =>
                                            setTimeFilter(
                                                item.key as TimeFilter,
                                            )
                                        }
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 999,
                                            backgroundColor: selected
                                                ? colors.primaryLight
                                                : colors.backgroundSecondary,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: selected
                                                    ? colors.primary
                                                    : colors.textSecondary,
                                                fontSize: 12,
                                            }}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={{ marginTop: 14, minHeight: 300 }}>
                            {groupedMedia.length === 0 ? (
                                <View
                                    style={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingVertical: 40,
                                    }}
                                >
                                    <Text
                                        style={{ color: colors.textSecondary }}
                                    >
                                        No media found.
                                    </Text>
                                </View>
                            ) : (
                                groupedMedia.map(([day, items]) => (
                                    <View
                                        key={day}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Text
                                            style={{
                                                color: colors.textSecondary,
                                                fontSize: 12,
                                                fontWeight: '600',
                                                marginHorizontal: 14,
                                                marginBottom: 8,
                                            }}
                                        >
                                            {day}
                                        </Text>

                                        {activeTab === 'images' ? (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    flexWrap: 'wrap',
                                                    paddingHorizontal: 10,
                                                }}
                                            >
                                                {items.map((item) => (
                                                    <TouchableOpacity
                                                        key={item._id}
                                                        style={{
                                                            width: '33.33%',
                                                            padding: 4,
                                                        }}
                                                        onPress={async () => {
                                                            if (item.mediaUrl) {
                                                                await Linking.openURL(
                                                                    item.mediaUrl,
                                                                );
                                                            }
                                                        }}
                                                        onLongPress={() => {
                                                            setSelectedMessage(
                                                                item,
                                                            );
                                                            setIsMediaActionVisible(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Image
                                                            source={{
                                                                uri: item.mediaUrl,
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                aspectRatio: 1,
                                                                borderRadius: 10,
                                                                backgroundColor:
                                                                    colors.backgroundSecondary,
                                                            }}
                                                        />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        ) : (
                                            <View
                                                style={{
                                                    paddingHorizontal: 14,
                                                    gap: 8,
                                                }}
                                            >
                                                {items.map((item) => (
                                                    <TouchableOpacity
                                                        key={item._id}
                                                        style={{
                                                            backgroundColor:
                                                                colors.backgroundSecondary,
                                                            borderRadius: 10,
                                                            padding: 10,
                                                            flexDirection:
                                                                'row',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'space-between',
                                                        }}
                                                        onPress={async () => {
                                                            const link =
                                                                activeTab ===
                                                                'links'
                                                                    ? item.content.match(
                                                                          /https?:\/\/\S+|www\.\S+/i,
                                                                      )?.[0] ||
                                                                      item.content
                                                                    : item.mediaUrl ||
                                                                      item.content;

                                                            if (link) {
                                                                await Linking.openURL(
                                                                    link.startsWith(
                                                                        'http',
                                                                    )
                                                                        ? link
                                                                        : `https://${link}`,
                                                                );
                                                            }
                                                        }}
                                                        onLongPress={() => {
                                                            setSelectedMessage(
                                                                item,
                                                            );
                                                            setIsMediaActionVisible(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                paddingRight: 8,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    color: colors.text,
                                                                    fontSize: 14,
                                                                }}
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {activeTab ===
                                                                'links'
                                                                    ? item.content.match(
                                                                          /https?:\/\/\S+|www\.\S+/i,
                                                                      )?.[0] ||
                                                                      item.content
                                                                    : item.fileName ||
                                                                      item.content ||
                                                                      'File'}
                                                            </Text>
                                                            <Text
                                                                style={{
                                                                    color: colors.textSecondary,
                                                                    fontSize: 11,
                                                                    marginTop: 4,
                                                                }}
                                                            >
                                                                {new Date(
                                                                    item.createdAt ||
                                                                        '',
                                                                ).toLocaleString()}
                                                            </Text>
                                                        </View>
                                                        <Ionicons
                                                            name="ellipsis-vertical"
                                                            size={18}
                                                            color={
                                                                colors.textSecondary
                                                            }
                                                        />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                </ScrollView>
            )}

            <MediaActionSheet
                visible={isMediaActionVisible}
                onClose={() => setIsMediaActionVisible(false)}
                onAction={(action) => {
                    void handleMediaAction(action);
                }}
            />
        </SafeAreaView>
    );
}
