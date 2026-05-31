import { MessageCircle, Users, Sparkles, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationContext } from '@/context/NotificationContext';
import { useThemeColors } from '@/hooks/useThemeColors';

const TAB_LABELS: Record<string, string> = {
    index: 'Chats',
    friends: 'Friends',
    ai: 'Orion AI',
    setting: 'Profile',
};

export default function CustomTabBar({ state, navigation }: any) {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();

    const notificationContext = useNotificationContext();
    const unreadMessageCount = notificationContext?.unreadMessageCount ?? 0;
    const unreadCount = notificationContext?.unreadCount ?? 0;

    const VISIBLE = new Set(['index', 'friends', 'ai', 'setting']);
    const focusedKey = state.routes[state.index]?.key;
    const renderIcon = (routeName: string, isFocused: boolean) => {
        const iconColor = isFocused ? colors.primary : colors.textSecondary;
        const strokeWidth = isFocused ? 2.4 : 1.7;
        const commonProps = { size: 22, strokeWidth, color: iconColor };

        if (routeName === 'friends') return <Users {...commonProps} />;
        if (routeName === 'ai') return <Sparkles {...commonProps} />;
        if (routeName === 'setting') return <User {...commonProps} />;
        return <MessageCircle {...commonProps} />;
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingBottom: Math.max(insets.bottom, 8),
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                },
            ]}
        >
            {state.routes
                .filter((route: any) => VISIBLE.has(route.name))
                .map((route: any) => {
                    const isFocused = route.key === focusedKey;
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
                                    isFocused && {
                                        backgroundColor: colors.primaryLight,
                                    },
                                ]}
                            >
                                {renderIcon(route.name, isFocused)}

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
                                    {
                                        color: isFocused
                                            ? colors.primary
                                            : colors.textSecondary,
                                        fontWeight: isFocused ? '700' : '500',
                                    },
                                ]}
                                numberOfLines={1}
                            >
                                {label}
                            </Text>

                            {isFocused && (
                                <View
                                    style={[
                                        styles.dot,
                                        { backgroundColor: colors.primary },
                                    ]}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderTopWidth: 1,
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
    },
    label: {
        fontSize: 10,
    },
    labelActive: {
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
    },
});
