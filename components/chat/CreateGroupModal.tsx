import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { friendApi } from '@/services/api/friend';
import { chatApi } from '@/services/api/chat';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Friend {
    id: string;
    fullName: string;
    avatarUrl?: string;
}

interface CreateGroupModalProps {
    visible: boolean;
    onClose: () => void;
    onGroupCreated?: (conversationId: string) => void;
}

export default function CreateGroupModal({
    visible,
    onClose,
    onGroupCreated,
}: CreateGroupModalProps) {
    const { colors } = useTheme();

    const [groupName, setGroupName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Load friends and current user when modal opens
    useEffect(() => {
        if (visible) {
            loadCurrentUserId();
            loadFriends();
        }
    }, [visible]);

    const loadCurrentUserId = async () => {
        try {
            const candidates = [
                await AsyncStorage.getItem('userId'),
                await AsyncStorage.getItem('user.id'),
            ];

            try {
                const authUser = await AsyncStorage.getItem('auth_user');
                if (authUser) {
                    const parsed = JSON.parse(authUser);
                    candidates.push(parsed?.userId || parsed?.id);
                }
            } catch {
                // ignore
            }

            const userId = candidates.find(
                (id) => id && typeof id === 'string' && id.trim().length > 0,
            );
            if (userId) {
                setCurrentUserId(String(userId).trim());
            }
        } catch (err) {
            console.error(
                '[CreateGroupModal] Error loading current user ID:',
                err,
            );
        }
    };

    const loadFriends = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user ID from AsyncStorage
            const candidates = [
                await AsyncStorage.getItem('userId'),
                await AsyncStorage.getItem('user.id'),
            ];

            try {
                const authUser = await AsyncStorage.getItem('auth_user');
                if (authUser) {
                    const parsed = JSON.parse(authUser);
                    candidates.push(parsed?.userId || parsed?.id);
                }
            } catch {
                // ignore
            }

            const userId = candidates.find(
                (id) => id && typeof id === 'string' && id.trim().length > 0,
            );

            if (!userId) {
                setError('Không thể xác định userId');
                console.error('[CreateGroupModal] No userId found');
                return;
            }

            console.log(
                '[CreateGroupModal] Loading friends for userId:',
                userId,
            );
            const response = await friendApi.getFriends(userId);
            console.log(
                '[CreateGroupModal] Got friends response:',
                response?.length || 0,
                'friends',
            );
            setFriends(response || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể tải danh sách bạn bè',
            );
            console.error('[CreateGroupModal] Error loading friends:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = friends
        .filter((friend) => {
            // Exclude current user from list
            if (currentUserId && friend.id === currentUserId) {
                return false;
            }
            // Filter by search text
            return friend.fullName
                .toLowerCase()
                .includes(searchText.toLowerCase());
        })
        // Deduplicate by friend ID
        .filter(
            (friend, index, self) =>
                self.findIndex((f) => f.id === friend.id) === index,
        );

    const toggleFriend = (friendId: string) => {
        setSelectedFriends((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId],
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setError('Vui lòng nhập tên nhóm');
            return;
        }

        if (selectedFriends.length === 0) {
            setError('Vui lòng chọn ít nhất 1 thành viên');
            return;
        }

        try {
            setCreating(true);
            setError(null);

            // Get friend details for nicknames
            const selectedFriendsData = friends.filter((f) =>
                selectedFriends.includes(f.id),
            );

            const memberNicknames = selectedFriendsData.map((friend) => ({
                userId: friend.id,
                nickname: friend.fullName,
            }));

            const response = await chatApi.createConversation({
                type: 'GROUP',
                groupName: groupName.trim(),
                memberIds: selectedFriends,
                memberNicknames,
            });

            onGroupCreated?.(response.conversationId);
            resetModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tạo nhóm');
        } finally {
            setCreating(false);
        }
    };

    const resetModal = () => {
        setGroupName('');
        setSelectedFriends([]);
        setSearchText('');
        setError(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={resetModal}
        >
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                {/* Header */}
                <View
                    style={{
                        paddingTop: 12,
                        paddingHorizontal: 16,
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
                        Tạo nhóm mới
                    </Text>
                    <TouchableOpacity onPress={resetModal} disabled={creating}>
                        <MaterialCommunityIcons
                            name="close"
                            size={24}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1, padding: 16 }}>
                    {/* Group Name Input */}
                    <View style={{ marginBottom: 20 }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: colors.text,
                                marginBottom: 8,
                            }}
                        >
                            Tên nhóm
                        </Text>
                        <TextInput
                            placeholder="Nhập tên nhóm"
                            value={groupName}
                            onChangeText={setGroupName}
                            editable={!creating}
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: 12,
                                color: colors.text,
                                fontSize: 14,
                            }}
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Friend Search */}
                    <View style={{ marginBottom: 16 }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: colors.text,
                                marginBottom: 8,
                            }}
                        >
                            Chọn thành viên
                        </Text>
                        <TextInput
                            placeholder="Tìm kiếm bạn bè"
                            value={searchText}
                            onChangeText={setSearchText}
                            editable={!loading && !creating}
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: 12,
                                color: colors.text,
                                fontSize: 14,
                                marginBottom: 12,
                            }}
                            placeholderTextColor={colors.textSecondary}
                        />

                        {/* Friends List */}
                        {loading ? (
                            <View
                                style={{
                                    paddingVertical: 20,
                                    alignItems: 'center',
                                }}
                            >
                                <ActivityIndicator
                                    size="large"
                                    color={colors.primary}
                                />
                            </View>
                        ) : filteredFriends.length === 0 ? (
                            <View
                                style={{
                                    paddingVertical: 20,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: colors.textSecondary }}>
                                    {searchText
                                        ? 'Không tìm thấy bạn bè'
                                        : 'Chưa có bạn bè'}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                scrollEnabled={false}
                                data={filteredFriends}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => toggleFriend(item.id)}
                                        disabled={creating}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 12,
                                            paddingHorizontal: 12,
                                            marginBottom: 8,
                                            backgroundColor:
                                                colors.backgroundSecondary,
                                            borderRadius: 8,
                                            borderWidth:
                                                selectedFriends.includes(
                                                    item.id,
                                                )
                                                    ? 2
                                                    : 0,
                                            borderColor: colors.primary,
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                backgroundColor: colors.border,
                                                marginRight: 12,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {item.avatarUrl ? (
                                                <Image
                                                    source={{
                                                        uri: item.avatarUrl,
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                    }}
                                                />
                                            ) : (
                                                <MaterialCommunityIcons
                                                    name="account"
                                                    size={24}
                                                    color={colors.textSecondary}
                                                />
                                            )}
                                        </View>

                                        <Text
                                            style={{
                                                flex: 1,
                                                color: colors.text,
                                                fontSize: 14,
                                                fontWeight: '500',
                                            }}
                                        >
                                            {item.fullName}
                                        </Text>

                                        <MaterialCommunityIcons
                                            name={
                                                selectedFriends.includes(
                                                    item.id,
                                                )
                                                    ? 'checkbox-marked'
                                                    : 'checkbox-blank-outline'
                                            }
                                            size={24}
                                            color={
                                                selectedFriends.includes(
                                                    item.id,
                                                )
                                                    ? colors.primary
                                                    : colors.textSecondary
                                            }
                                        />
                                    </TouchableOpacity>
                                )}
                            />
                        )}

                        {/* Selected Count */}
                        <Text
                            style={{
                                marginTop: 12,
                                fontSize: 12,
                                color: colors.textSecondary,
                            }}
                        >
                            Đã chọn {selectedFriends.length} thành viên
                        </Text>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View
                            style={{
                                backgroundColor: '#fee2e2',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 16,
                            }}
                        >
                            <Text style={{ color: '#dc2626', fontSize: 14 }}>
                                {error}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Action Buttons */}
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 12,
                        padding: 16,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                    }}
                >
                    <TouchableOpacity
                        onPress={resetModal}
                        disabled={creating}
                        style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            backgroundColor: colors.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 14,
                                fontWeight: '600',
                            }}
                        >
                            Hủy
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCreateGroup}
                        disabled={
                            creating ||
                            !groupName.trim() ||
                            selectedFriends.length === 0
                        }
                        style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity:
                                creating ||
                                !groupName.trim() ||
                                selectedFriends.length === 0
                                    ? 0.6
                                    : 1,
                        }}
                    >
                        {creating ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 14,
                                    fontWeight: '600',
                                }}
                            >
                                Tạo nhóm
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
