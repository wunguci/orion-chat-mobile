import { notificationApi } from '@/services/api/notification';
import { notificationSocketService } from '@/services/websocket/notificationSocket';
import type { AppNotification } from '@/types/notification';
import { tokenUtils } from '@/utils/tokenUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Animated,
    PanResponder,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

type NotificationToastItem = {
    id: string;
    notification: AppNotification;
};

type NotificationContextValue = {
    notifications: AppNotification[];
    unreadCount: number;
    unreadMessageCount: number;
    unreadByConversation: Record<string, number>;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<AppNotification | null>;
    markConversationNotificationsAsRead: (
        conversationId: string,
    ) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    openNotification: (item: AppNotification) => Promise<void>;
    setActiveConversationId: (conversationId?: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
    null,
);

const normalizeMetadataId = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.length > 0) return value;
    if (typeof value === 'number') return String(value);

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return normalizeMetadataId(record._id || record.id);
    }

    return undefined;
};

const getNotificationConversationId = (
    item: AppNotification,
): string | undefined => {
    const metadata = item.metadata;
    if (!metadata || typeof metadata !== 'object') return undefined;

    const conversationId = normalizeMetadataId(metadata.conversationId);
    if (conversationId) {
        return conversationId;
    }

    const groupId = normalizeMetadataId(metadata.groupId);
    if (groupId) {
        return groupId;
    }

    const chatLink = typeof item.link === 'string' ? item.link : '';
    const linkMatch = chatLink.match(/\/chat\/([^/?#]+)/);
    if (linkMatch?.[1]) return decodeURIComponent(linkMatch[1]);

    return undefined;
};

const isConversationScopedNotification = (item: AppNotification): boolean => {
    const conversationId = getNotificationConversationId(item);
    if (!conversationId) return false;

    return (
        item.type === 'message' ||
        item.type === 'call' ||
        item.type === 'group_invite' ||
        item.type === 'group_join_approved' ||
        item.type === 'group_join_rejected' ||
        item.type === 'group_promoted' ||
        item.type === 'group_removed' ||
        item.type === 'group_dissolved'
    );
};

const getRelativeNotificationTime = (item: AppNotification) => {
    const rawDate =
        (item as AppNotification & { createdAt?: string; updatedAt?: string })
            .createdAt ||
        (item as AppNotification & { createdAt?: string; updatedAt?: string })
            .updatedAt;
    const time = rawDate ? new Date(rawDate).getTime() : Date.now();
    if (Number.isNaN(time)) return 'bây giờ';

    const diffMs = Math.max(0, Date.now() - time);
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'bây giờ';
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
};

const getNotificationText = (item: AppNotification) => {
    const metadata = item.metadata || {};
    const conversationType = String(
        metadata.conversationType || '',
    ).toLowerCase();
    const isGroupMessage =
        item.type === 'message' &&
        (conversationType === 'group' ||
            typeof metadata.groupName === 'string' ||
            typeof metadata.groupId === 'string');

    if (isGroupMessage) {
        return {
            title:
                typeof metadata.groupName === 'string' &&
                metadata.groupName.trim()
                    ? metadata.groupName
                    : 'Nhóm',
            subtitle:
                typeof metadata.senderName === 'string' &&
                metadata.senderName.trim()
                    ? metadata.senderName
                    : item.title,
            body: item.body || 'Tin nhắn mới',
            icon: 'account-group' as const,
        };
    }

    return {
        title: item.title || 'Thông báo mới',
        subtitle: undefined,
        body: item.body || 'Bạn có thông báo mới',
        icon:
            item.type === 'message'
                ? ('message-text' as const)
                : ('bell' as const),
    };
};

function NotificationToastBanner({
    item,
    onDismiss,
    onOpen,
}: {
    item: NotificationToastItem | null;
    onDismiss: (id: string) => void;
    onOpen: (item: AppNotification) => void;
}) {
    const insets = useSafeAreaInsets();
    const translate = useRef(new Animated.ValueXY({ x: 0, y: -18 })).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const dismissCurrent = useCallback(() => {
        if (item) onDismiss(item.id);
    }, [item, onDismiss]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: (_, gesture) =>
                    gesture.dy < -8 &&
                    Math.abs(gesture.dy) > Math.abs(gesture.dx),
                onPanResponderMove: (_, gesture) => {
                    translate.setValue({
                        x: 0,
                        y: Math.min(0, gesture.dy),
                    });
                },
                onPanResponderRelease: (_, gesture) => {
                    if (gesture.dy < -42) {
                        Animated.parallel([
                            Animated.timing(opacity, {
                                toValue: 0,
                                duration: 140,
                                useNativeDriver: true,
                            }),
                            Animated.timing(translate, {
                                toValue: {
                                    x: 0,
                                    y: -120,
                                },
                                duration: 140,
                                useNativeDriver: true,
                            }),
                        ]).start(dismissCurrent);
                        return;
                    }

                    Animated.spring(translate, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                        friction: 7,
                    }).start();
                },
            }),
        [dismissCurrent, opacity, translate],
    );

    useEffect(() => {
        if (!item) return;

        translate.setValue({ x: 0, y: -18 });
        opacity.setValue(0);

        Animated.parallel([
            Animated.spring(translate, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: true,
                friction: 8,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(translate, {
                    toValue: { x: 0, y: -18 },
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start(() => onDismiss(item.id));
        }, 5200);

        return () => clearTimeout(timer);
    }, [item, onDismiss, opacity, translate]);

    if (!item) return null;

    const { notification } = item;
    const display = getNotificationText(notification);
    const relativeTime = getRelativeNotificationTime(notification);

    return (
        <View
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: insets.top + 10,
                zIndex: 50,
                paddingHorizontal: 12,
            }}
        >
            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    opacity,
                    transform: translate.getTranslateTransform(),
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onOpen(notification)}
                    style={{
                        borderRadius: 10,
                        backgroundColor: '#f0fdfa',
                        // borderLeftWidth: 3,
                        // borderLeftColor: '#0D9488',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        shadowColor: '#0F766E',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.16,
                        shadowRadius: 30,
                        elevation: 6,
                    }}
                >
                    <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                        <View
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                marginRight: 12,
                                backgroundColor: '#D8F3EE',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <MaterialCommunityIcons
                                name={display.icon}
                                size={19}
                                color="#0F766E"
                            />
                        </View>

                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: '#0f172a',
                                    fontSize: 14,
                                    fontWeight: '800',
                                }}
                            >
                                {display.title}
                            </Text>
                            {display.subtitle ? (
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: '#0F766E',
                                        fontSize: 12,
                                        fontWeight: '700',
                                        marginTop: 2,
                                    }}
                                >
                                    {display.subtitle}
                                </Text>
                            ) : null}
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: '#334155',
                                    fontSize: 12,
                                    marginTop: 3,
                                }}
                            >
                                {display.body}
                            </Text>
                        </View>

                        <Text
                            style={{
                                color: '#64748b',
                                fontSize: 11,
                                fontWeight: '600',
                                marginLeft: 10,
                                alignSelf: 'flex-start',
                            }}
                        >
                            {relativeTime}
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

export function NotificationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const routeParams = useLocalSearchParams<{ id?: string | string[] }>();
    const { state } = useAuth();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [toastItems, setToastItems] = useState<NotificationToastItem[]>([]);
    const currentConversationIdRef = useRef<string | undefined>(undefined);

    const userId = state.user?.userId;
    const currentConversationId = useMemo(() => {
        const routeId = Array.isArray(routeParams.id)
            ? routeParams.id[0]
            : routeParams.id;

        return pathname?.startsWith('/chat/') && routeId ? routeId : undefined;
    }, [pathname, routeParams.id]);

    const setActiveConversationId = useCallback((conversationId?: string) => {
        currentConversationIdRef.current = conversationId;
    }, []);

    useEffect(() => {
        if (currentConversationId) {
            currentConversationIdRef.current = currentConversationId;
        }
    }, [currentConversationId]);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const [listRes, unreadRes] = await Promise.all([
                notificationApi.getMyNotifications(20, 0),
                notificationApi.getUnreadCount(),
            ]);

            setNotifications(listRes.items || []);
            setUnreadCount(unreadRes.count || 0);
        } catch (error) {
            console.error('Failed to fetch mobile notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const markAsRead = useCallback(
        async (id: string) => {
            try {
                const updated = await notificationApi.markAsRead(id);
                const target = notifications.find((item) => item._id === id);
                const shouldDecrease = !!target && !target.isRead;

                setNotifications((prev) =>
                    prev.map((item) => (item._id === id ? updated : item)),
                );

                if (shouldDecrease) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }

                return updated;
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
                return null;
            }
        },
        [notifications],
    );

    const markConversationNotificationsAsRead = useCallback(
        async (conversationId: string) => {
            if (!conversationId) return;

            const pending = notifications.filter(
                (item) =>
                    !item.isRead &&
                    isConversationScopedNotification(item) &&
                    getNotificationConversationId(item) === conversationId,
            );

            if (pending.length === 0) return;

            await Promise.all(pending.map((item) => markAsRead(item._id)));

            try {
                const unread = await notificationApi.getUnreadCount();
                setUnreadCount(unread.count || 0);
            } catch (error) {
                console.error(
                    'Failed to refresh unread count after conversation read:',
                    error,
                );
            }
        },
        [notifications, markAsRead],
    );

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) =>
                prev.map((item) => ({ ...item, isRead: true })),
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, []);

    const deleteNotification = useCallback(
        async (id: string) => {
            try {
                const target = notifications.find((item) => item._id === id);
                await notificationApi.remove(id);

                setNotifications((prev) =>
                    prev.filter((item) => item._id !== id),
                );
                setToastItems((prev) => prev.filter((item) => item.id !== id));

                if (target && !target.isRead) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
            } catch (error) {
                console.error('Failed to delete notification:', error);
            }
        },
        [notifications],
    );

    const dismissToast = useCallback((id: string) => {
        setToastItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const openNotification = useCallback(
        async (item: AppNotification) => {
            setToastItems((prev) =>
                prev.filter((toast) => toast.notification._id !== item._id),
            );

            if (!item.isRead) {
                await markAsRead(item._id);
            }

            const conversationId = getNotificationConversationId(item);

            if (conversationId && isConversationScopedNotification(item)) {
                await markConversationNotificationsAsRead(conversationId);
                router.push({
                    pathname: '/chat/[id]',
                    params: {
                        id: conversationId,
                        name: item.title || 'Chat',
                    },
                });
                return;
            }

            if (item.type === 'friend_request') {
                router.push({
                    pathname: '/(tabs)/friends',
                    params: { activeCategory: 'requests' },
                });
                return;
            }

            if (item.type === 'group_invite') {
                router.push({
                    pathname: '/(tabs)/friends',
                    params: { activeCategory: 'group_invites' },
                });
                return;
            }

            if (
                item.type === 'event_invite' ||
                item.type === 'event_reminder'
            ) {
                router.push('/(tabs)/calendar');
                return;
            }

            if (item.link?.startsWith('/friends')) {
                router.push('/(tabs)/friends');
                return;
            }

            if (item.link?.startsWith('/calendar')) {
                router.push('/(tabs)/calendar');
                return;
            }

            if (item.link?.startsWith('/chat')) {
                router.push('/(tabs)');
            }
        },
        [markAsRead, markConversationNotificationsAsRead, router],
    );

    useEffect(() => {
        if (!userId) return;
        fetchNotifications().catch(() => undefined);
    }, [userId, fetchNotifications]);

    useEffect(() => {
        if (!userId) return;

        let mounted = true;

        const setupSocket = async () => {
            const token = await tokenUtils.getToken();
            if (!mounted) return;

            const socket = notificationSocketService.connect(
                userId,
                token || undefined,
            );

            const handleNew = (payload: AppNotification) => {
                setNotifications((prev) => {
                    const hasExisting = prev.some(
                        (item) => item._id === payload._id,
                    );
                    if (hasExisting) {
                        return prev.map((item) =>
                            item._id === payload._id ? payload : item,
                        );
                    }
                    return [payload, ...prev];
                });

                const payloadConversationId =
                    getNotificationConversationId(payload);
                const isCurrentConversation =
                    isConversationScopedNotification(payload) &&
                    payloadConversationId &&
                    payloadConversationId === currentConversationIdRef.current;

                if (!isCurrentConversation) {
                    setToastItems(() => {
                        return [{ id: payload._id, notification: payload }];
                    });
                }

                void handleRefreshUnread();
            };

            const handleUpdated = (payload: AppNotification) => {
                setNotifications((prev) =>
                    prev.map((item) =>
                        item._id === payload._id ? payload : item,
                    ),
                );
            };

            const handleRefreshUnread = async () => {
                try {
                    const unread = await notificationApi.getUnreadCount();
                    setUnreadCount(unread.count || 0);
                } catch (error) {
                    console.error(
                        'Failed to refresh mobile unread count:',
                        error,
                    );
                }
            };

            socket.on('notifications:new', handleNew);
            socket.on('notifications:updated', handleUpdated);
            socket.on('notifications:refresh_unread', handleRefreshUnread);
            socket.on('notifications:all_read', () => {
                setNotifications((prev) =>
                    prev.map((item) => ({ ...item, isRead: true })),
                );
                setUnreadCount(0);
            });

            return () => {
                socket.off('notifications:new', handleNew);
                socket.off('notifications:updated', handleUpdated);
                socket.off('notifications:refresh_unread', handleRefreshUnread);
                socket.off('notifications:all_read');
            };
        };

        let cleanupSocketListeners: (() => void) | undefined;
        setupSocket().then((cleanup) => {
            cleanupSocketListeners = cleanup;
        });

        return () => {
            mounted = false;
            cleanupSocketListeners?.();
            notificationSocketService.disconnect();
        };
    }, [userId]);

    const unreadMessageCount = useMemo(
        () =>
            notifications.filter(
                (item) =>
                    !item.isRead && isConversationScopedNotification(item),
            ).length,
        [notifications],
    );

    const unreadByConversation = useMemo(() => {
        const result: Record<string, number> = {};

        notifications.forEach((item) => {
            const conversationId = getNotificationConversationId(item);
            if (
                !item.isRead &&
                typeof conversationId === 'string' &&
                isConversationScopedNotification(item)
            ) {
                result[conversationId] = (result[conversationId] || 0) + 1;
            }
        });

        return result;
    }, [notifications]);

    const value = useMemo<NotificationContextValue>(
        () => ({
            notifications,
            unreadCount,
            unreadMessageCount,
            unreadByConversation,
            loading,
            fetchNotifications,
            markAsRead,
            markConversationNotificationsAsRead,
            markAllAsRead,
            deleteNotification,
            openNotification,
            setActiveConversationId,
        }),
        [
            notifications,
            unreadCount,
            unreadMessageCount,
            unreadByConversation,
            loading,
            fetchNotifications,
            markAsRead,
            markConversationNotificationsAsRead,
            markAllAsRead,
            deleteNotification,
            openNotification,
            setActiveConversationId,
        ],
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationToastBanner
                item={toastItems[0] ?? null}
                onDismiss={dismissToast}
                onOpen={(notification) => {
                    void openNotification(notification);
                }}
            />
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            'useNotificationContext must be used within NotificationProvider',
        );
    }

    return context;
}
