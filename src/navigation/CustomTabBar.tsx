import { MessageCircle, Users, Sparkles, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { whColors } from '@/constants/tailwindColors';
import { useNotificationContext } from '@/context/NotificationContext';

type TabIconType = {
    default: React.ReactNode;
    active: React.ReactNode;
};

const TAB_ICON: Record<string, TabIconType> = {
    index: {
        default: (
            <MessageCircle size={22} strokeWidth={1.7} color={whColors.textMuted} />
        ),
        active: (
            <MessageCircle size={22} strokeWidth={2.4} color={whColors.primary} />
        ),
    },
    friends: {
        default: (
            <Users size={22} strokeWidth={1.7} color={whColors.textMuted} />
        ),
        active: (
            <Users size={22} strokeWidth={2.4} color={whColors.primary} />
        ),
    },
    ai: {
        default: (
            <Sparkles size={22} strokeWidth={1.7} color={whColors.textMuted} />
        ),
        active: (
            <Sparkles size={22} strokeWidth={2.4} color={whColors.primary} />
        ),
    },
    setting: {
        default: (
            <User size={22} strokeWidth={1.7} color={whColors.textMuted} />
        ),
        active: (
            <User size={22} strokeWidth={2.4} color={whColors.primary} />
        ),
    },
};

const TAB_LABELS: Record<string, string> = {
    index: 'Chats',
    friends: 'Friends',
    ai: 'Orion AI',
    setting: 'Profile',
};

export default function CustomTabBar({ state, navigation }: any) {
    const insets = useSafeAreaInsets();

    const notificationContext = useNotificationContext();
    const unreadMessageCount = notificationContext?.unreadMessageCount ?? 0;
    const unreadCount = notificationContext?.unreadCount ?? 0;

    const VISIBLE = new Set(['index', 'friends', 'ai', 'setting']);
    const focusedKey = state.routes[state.index]?.key;

    return (
        <View
            style={[
                styles.container,
                { paddingBottom: Math.max(insets.bottom, 8) },
            ]}
        >
            {state.routes
                .filter((route: any) => VISIBLE.has(route.name))
                .map((route: any) => {
                    const isFocused = route.key === focusedKey;
                    const iconSet = TAB_ICON[route.name];
                    const label = TAB_LABELS[route.name];

                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={styles.tabItem}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });
                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.iconWrap,
                                    isFocused && styles.iconWrapActive,
                                ]}
                            >
                                {isFocused ? iconSet.active : iconSet.default}

                                {/* Unread badge for chat */}
                                {route.name === 'index' && unreadMessageCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                        </Text>
                                    </View>
                                )}

                                {/* Unread badge for notifications */}
                                {route.name === 'setting' && unreadCount > 0 && (
                                    <View style={styles.badgeAlt}>
                                        <Text style={styles.badgeText}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <Text
                                style={[
                                    styles.label,
                                    isFocused && styles.labelActive,
                                ]}
                                numberOfLines={1}
                            >
                                {label}
                            </Text>

                            {isFocused && <View style={styles.dot} />}
                        </TouchableOpacity>
                    );
                })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: whColors.bgLight,
        borderTopWidth: 1,
        borderTopColor: whColors.borderLight,
        paddingTop: 6,
        paddingHorizontal: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
        paddingVertical: 2,
    },
    iconWrap: {
        width: 44,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        backgroundColor: whColors.bgHeavy,
    },
    label: {
        fontSize: 10,
        color: whColors.textMuted,
        fontWeight: '500',
    },
    labelActive: {
        color: whColors.primary,
        fontWeight: '700',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 3,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
        lineHeight: 11,
    },
    badgeAlt: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 3,
        backgroundColor: '#fb923c',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: whColors.primary,
    },
});
