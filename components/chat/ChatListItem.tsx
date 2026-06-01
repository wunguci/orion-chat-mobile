import { useTheme } from '@/hooks/useTheme';
import { ChatItem } from '@/types/chat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import ChatAvatar from './ChatAvatar';

interface ChatListItemProps {
    item: ChatItem;
    onPress?: (item: ChatItem) => void;
    onLongPress?: (item: ChatItem) => void;
    onTogglePin?: (item: ChatItem) => void;
    onClearHistory?: (item: ChatItem) => void;
    onDelete?: (item: ChatItem) => void;
    onSwipeOpen?: (id: string, ref: Swipeable | null) => void;
}

export default function ChatListItem({
    item,
    onPress,
    onLongPress,
    onTogglePin,
    onClearHistory,
    onDelete,
    onSwipeOpen,
}: ChatListItemProps) {
    const { colors } = useTheme();
    const swipeableRef = useRef<Swipeable | null>(null);

    const renderRightMeta = () => {
        if (item.unread > 0) {
            return (
                <View
                    style={{
                        backgroundColor: colors.primary,
                        borderRadius: 12,
                        minWidth: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 6,
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: '700',
                        }}
                    >
                        {item.unread > 99
                            ? '99+'
                            : item.unread > 5
                              ? `${item.unread}+`
                              : item.unread}
                    </Text>
                </View>
            );
        }

        if (item.isMuted) {
            return (
                <Ionicons
                    name="volume-mute-outline"
                    size={18}
                    color={colors.textSecondary}
                />
            );
        }

        if (item.isSentByMe && item.isRead) {
            return (
                <MaterialCommunityIcons
                    name="check-all"
                    size={18}
                    color={colors.primary}
                />
            );
        }

        return null;
    };

    const renderRightActions = () => (
        <View style={{ flexDirection: 'row', backgroundColor: colors.background }}>
            <SwipeAction
                label={item.isPinned ? 'Unpin' : 'Pin'}
                icon={item.isPinned ? 'pin-off' : 'pin'}
                backgroundColor="#f59e0b"
                onPress={() => {
                    swipeableRef.current?.close();
                    onTogglePin?.(item);
                }}
            />
            <SwipeAction
                label="Clear history"
                icon="broom"
                backgroundColor="#64748b"
                onPress={() => {
                    swipeableRef.current?.close();
                    onClearHistory?.(item);
                }}
            />
            <SwipeAction
                label="Delete"
                icon="delete-outline"
                backgroundColor="#ef4444"
                onPress={() => {
                    swipeableRef.current?.close();
                    onDelete?.(item);
                }}
            />
        </View>
    );

    const handlePress = () => {
        if (onPress) {
            onPress(item);
        } else {
            router.push({
                pathname: '/chat/[id]',
                params: {
                    id: item.id,
                    name: item.name,
                    avatarUri: item.avatarUri ?? '',
                    otherUserId: item.otherUserId ?? '',
                    isGroup: item.isGroup ? 'true' : 'false',
                    participantIds: item.participantIds?.join(',') ?? '',
                },
            });
        }
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            overshootRight={false}
            friction={2}
            rightThreshold={40}
            onSwipeableWillOpen={() => onSwipeOpen?.(item.id, swipeableRef.current)}
        >
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={() => onLongPress?.(item)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: colors.background,
            }}
        >
            {/* Avatar */}
            <ChatAvatar
                name={item.name}
                avatarUri={item.avatarUri}
                avatarUris={item.avatarUris}
                isGroup={item.isGroup}
                size={52}
            />

            {/* Content */}
            <View style={{ flex: 1, marginLeft: 12 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                    }}
                >
                    <Text
                        style={{
                            flex: 1,
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.text,
                            marginRight: 8,
                        }}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>
                    {item.isPinned ? (
                        <MaterialCommunityIcons
                            name="pin"
                            size={14}
                            color={colors.primary}
                            style={{ marginRight: 6 }}
                        />
                    ) : null}
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {item.time}
                    </Text>
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text
                        style={{
                            flex: 1,
                            fontSize: 14,
                            color:
                                item.unread > 0
                                    ? colors.text
                                    : colors.textSecondary,
                            fontWeight: item.unread > 0 ? '500' : '400',
                            marginRight: 8,
                        }}
                        numberOfLines={1}
                    >
                        {item.lastMessage}
                    </Text>
                    {renderRightMeta()}
                </View>
            </View>
        </TouchableOpacity>
        </Swipeable>
    );
}

function SwipeAction({
    label,
    icon,
    backgroundColor,
    onPress,
}: {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    backgroundColor: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={{
                width: 78,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor,
                gap: 4,
            }}
        >
            <MaterialCommunityIcons name={icon} size={20} color="#fff" />
            <Text
                style={{
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: '700',
                    textAlign: 'center',
                }}
                numberOfLines={2}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}
