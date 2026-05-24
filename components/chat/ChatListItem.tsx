import { useTheme } from '@/hooks/useTheme';
import { ChatItem } from '@/types/chat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ChatAvatar from './ChatAvatar';

interface ChatListItemProps {
    item: ChatItem;
    onPress?: (item: ChatItem) => void;
    onLongPress?: (item: ChatItem) => void;
}

const UNREAD_COLOR = '#00B14F';

export default function ChatListItem({ item, onPress, onLongPress }: ChatListItemProps) {
    const { colors } = useTheme();

    const renderRightMeta = () => {
        if (item.unread > 0) {
            return (
                <View
                    style={{
                        backgroundColor: UNREAD_COLOR,
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
                    color={UNREAD_COLOR}
                />
            );
        }

        return null;
    };

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
                        {item.isSentByMe
                            ? `You: ${item.lastMessage}`
                            : item.lastMessage}
                    </Text>
                    {renderRightMeta()}
                </View>
            </View>
        </TouchableOpacity>
    );
}
