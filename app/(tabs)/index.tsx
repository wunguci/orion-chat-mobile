import { BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';

// Mock data
const MOCK_CHATS = [
    {
        id: '1',
        name: 'John Doe',
        lastMessage: 'Hey, how are you?',
        time: '10:30',
        unread: 2,
        online: true,
    },
    {
        id: '2',
        name: 'Jane Smith',
        lastMessage: 'Meeting at 3pm',
        time: 'Yesterday',
        unread: 0,
        online: false,
    },
    {
        id: '3',
        name: 'Team Chat',
        lastMessage: 'Alice: Great work!',
        time: '2 days ago',
        unread: 5,
        online: false,
    },
];

export default function ChatsScreen() {
    const { colors } = useTheme();

    const renderChatItem = ({ item }: any) => (
        <View
            style={[
                styles.chatCard,
                { backgroundColor: colors.card, borderColor: colors.border },
            ]}
        >
            <View style={styles.chatItem}>
                {/* Avatar */}
                <View
                    style={[styles.avatar, { backgroundColor: colors.primary }]}
                >
                    <Text style={styles.avatarText}>
                        {item.name
                            .split(' ')
                            .map((w: string) => w[0])
                            .join('')
                            .slice(0, 2)}
                    </Text>
                    {item.online && (
                        <View
                            style={[
                                styles.onlineDot,
                                { backgroundColor: '#34C759' },
                            ]}
                        />
                    )}
                </View>

                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.chatName, { color: colors.text }]}>
                            {item.name}
                        </Text>
                        <Text
                            style={[
                                styles.chatTime,
                                { color: colors.textSecondary },
                            ]}
                        >
                            {item.time}
                        </Text>
                    </View>

                    <View style={styles.chatFooter}>
                        <Text
                            style={[
                                styles.lastMessage,
                                { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}
                        >
                            {item.lastMessage}
                        </Text>
                        {item.unread > 0 && (
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: colors.primary },
                                ]}
                            >
                                <Text style={styles.badgeText}>
                                    {item.unread}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.background,
                        borderBottomColor: colors.border,
                    },
                ]}
            >
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Tin nhắn
                </Text>
            </View>

            <FlatList
                data={MOCK_CHATS}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        borderBottomWidth: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : Spacing.base,
    },
    headerTitle: {
        fontSize: FontSizes.xxl,
        fontWeight: '700',
    },
    list: {
        padding: Spacing.base,
    },
    chatCard: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    chatItem: {
        flexDirection: 'row',
        padding: Spacing.base,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    onlineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    chatName: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    chatTime: {
        fontSize: FontSizes.sm,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: FontSizes.base,
        flex: 1,
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: Spacing.sm,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
});
