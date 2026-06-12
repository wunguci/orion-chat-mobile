import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const RECENT_KEY = 'chat_mobile_recent_friend_searches';
const MAX_RECENT = 6;

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
    const router = useRouter();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<SearchUserItem[]>([]);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
    const [recentItems, setRecentItems] = useState<SearchUserItem[]>([]);
    const [suggestedItems, setSuggestedItems] = useState<SearchUserItem[]>([]);

    const saveRecentItems = async (items: SearchUserItem[]) => {
        setRecentItems(items);
        await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(items));
    };

    const upsertRecentItem = async (item: SearchUserItem) => {
        const next = [item, ...recentItems.filter((x) => x.id !== item.id)].slice(
            0,
            MAX_RECENT,
        );
        await saveRecentItems(next);
    };

    const openProfile = (user: SearchUserItem) => {
        router.push({
            pathname: '/friend-view',
            params: {
                userId: user.id,
                mode: 'suggested',
                name: user.fullName,
                avatar: user.avatarUrl || '',
                isOnline: user.isOnline ? '1' : '0',
                pending: pendingIds.has(user.id) ? '1' : '0',
            },
        });
    };

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
        const loadRecent = async () => {
            try {
                const raw = await AsyncStorage.getItem(RECENT_KEY);
                if (!raw) {
                    setRecentItems([]);
                    return;
                }
                const parsed = JSON.parse(raw) as SearchUserItem[];
                setRecentItems(Array.isArray(parsed) ? parsed : []);
            } catch {
                setRecentItems([]);
            }
        };
        const loadSuggestions = async () => {
            if (!currentUserId) return;
            try {
                const rows = await friendApi.getSuggestions(currentUserId);
                const mapped: SearchUserItem[] = rows.map((item) => ({
                    id: item.id,
                    fullName: item.fullName,
                    avatarUrl: item.avatarUrl,
                    phoneNumber: '',
                    isOnline: item.isOnline,
                }));
                setSuggestedItems(mapped);
            } catch {
                setSuggestedItems([]);
            }
        };

        void loadPending();
        void loadRecent();
        void loadSuggestions();
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
                const cleaned = rows.filter((item) => item.id !== currentUserId);
                setResults(cleaned);
                if (cleaned[0]) {
                    void upsertRecentItem(cleaned[0]);
                }
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
            const selected =
                results.find((item) => item.id === userId) ||
                recentItems.find((item) => item.id === userId) ||
                suggestedItems.find((item) => item.id === userId);
            if (selected) {
                void upsertRecentItem(selected);
            }
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
                ) : searchText.trim() ? (
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
                                onPress={() => openProfile(item)}
                            />
                        )}
                    />
                ) : (
                    <ScrollView
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 20,
                        }}
                    >
                        {recentItems.length > 0 && (
                            <>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: '700',
                                        color: colors.text,
                                        marginBottom: 8,
                                    }}
                                >
                                    Recent results
                                </Text>
                                <View style={{ marginBottom: 12 }}>
                                    {recentItems.map((item) => (
                                        <SearchUserRow
                                            key={`recent-row-${item.id}`}
                                            user={item}
                                            onAdd={handleAdd}
                                            isPending={
                                                pendingIds.has(item.id) ||
                                                sendingIds.has(item.id)
                                            }
                                            onPress={() => openProfile(item)}
                                        />
                                    ))}
                                </View>
                            </>
                        )}

                        {suggestedItems.length > 0 && (
                            <>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: '700',
                                        color: colors.text,
                                        marginBottom: 8,
                                    }}
                                >
                                    People you may know
                                </Text>
                                <View>
                                    {suggestedItems.map((item) => (
                                        <SearchUserRow
                                            key={`suggest-row-${item.id}`}
                                            user={item}
                                            onAdd={handleAdd}
                                            isPending={
                                                pendingIds.has(item.id) ||
                                                sendingIds.has(item.id)
                                            }
                                            onPress={() => openProfile(item)}
                                        />
                                    ))}
                                </View>
                            </>
                        )}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}
