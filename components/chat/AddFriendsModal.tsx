import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/useTheme';
import { friendApi } from '@/services/api/friend';
import type { SearchUserItem } from '@/types/friend';
import { SearchUserRow } from '@/components/friends/SearchUserRow';

interface AddFriendsModalProps {
    visible: boolean;
    currentUserId?: string;
    onClose: () => void;
}

export default function AddFriendsModal({
    visible,
    currentUserId,
    onClose,
}: AddFriendsModalProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<SearchUserItem[]>([]);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!visible) return;

        setSearchText('');
        setResults([]);
        setError(null);

        const loadPending = async () => {
            if (!currentUserId) return;
            try {
                const outgoing = await friendApi.getOutgoingFriendRequests(
                    currentUserId,
                );
                setPendingIds(
                    new Set(outgoing.map((item) => item.receiver.userId)),
                );
            } catch {
                setPendingIds(new Set());
            }
        };

        void loadPending();
    }, [currentUserId, visible]);

    useEffect(() => {
        if (!visible || !currentUserId) return;

        const query = searchText.trim();
        if (!query) {
            setResults([]);
            setError(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const rows = await friendApi.searchUsers(currentUserId, query);
                setResults(rows.filter((item) => item.id !== currentUserId));
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Cannot search users',
                );
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [currentUserId, searchText, visible]);

    const handleAdd = async (userId: string) => {
        if (!currentUserId || pendingIds.has(userId)) return;
        if (sendingIds.has(userId)) return;

        setSendingIds((prev) => new Set(prev).add(userId));
        try {
            await friendApi.sendFriendRequest(currentUserId, userId);
            setPendingIds((prev) => new Set(prev).add(userId));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Cannot send friend request',
            );
        } finally {
            setSendingIds((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    const isSearching = loading && searchText.trim().length > 0;
    const emptyState = !isSearching && results.length === 0 && searchText.trim();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    paddingTop: Math.max(insets.top, 0),
                    paddingBottom: insets.bottom,
                }}
            >
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingTop: 12,
                        paddingBottom: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: colors.text,
                        }}
                    >
                        Add Friends
                    </Text>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialCommunityIcons
                            name="close"
                            size={24}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            height: 44,
                        }}
                    >
                        <MaterialCommunityIcons
                            name="account-search-outline"
                            size={20}
                            color={colors.textSecondary}
                        />
                        <TextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search by phone"
                            placeholderTextColor={colors.textSecondary}
                            style={{
                                flex: 1,
                                marginLeft: 8,
                                color: colors.text,
                                fontSize: 16,
                            }}
                        />
                    </View>
                    {!!error && (
                        <Text style={{ color: colors.error, marginTop: 8 }}>
                            {error}
                        </Text>
                    )}
                </View>

                {isSearching && (
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

                {emptyState ? (
                    <View
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 24,
                        }}
                    >
                        <Text style={{ color: colors.textSecondary }}>
                            No users found.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        renderItem={({ item }) => (
                            <SearchUserRow
                                user={item}
                                onAdd={handleAdd}
                                isPending={
                                    pendingIds.has(item.id) ||
                                    sendingIds.has(item.id)
                                }
                            />
                        )}
                    />
                )}
            </View>
        </Modal>
    );
}
