import { API_BASE_URL } from '@/config/api';
import { useTheme } from '@/hooks/useTheme';
import {
    chatApi,
    ConversationMediaItem,
    ConversationResponse,
    GroupJoinRequest,
    GroupMemberItem,
} from '@/services/api/chat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Modal,
    Platform,
    ScrollView,
    Share,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConversationInfoModalProps {
    visible: boolean;
    conversationId: string;
    name: string;
    avatarUri?: string;
    isGroup?: boolean;
    onClose: () => void;
    onConversationDeleted?: (conversationId: string) => void;
}

type PasswordMode = 'hide' | 'reveal' | null;
const LOGIN_PRIMARY = '#006275';

const AUTO_DELETE_OPTIONS = [
    { label: 'Không bao giờ', value: 0 },
    { label: '1 ngày', value: 1 },
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
];

const toAbsoluteUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('data:') ||
        url.startsWith('blob:')
    ) {
        return url;
    }

    const base = API_BASE_URL.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
};

const getAutoDeleteLabel = (duration?: number) =>
    AUTO_DELETE_OPTIONS.find((item) => item.value === Number(duration || 0))
        ?.label || `${duration} ngày`;

const getRoleLabel = (role?: string | null) => {
    if (role === 'admin' || role === 'leader') return 'Trưởng nhóm';
    if (role === 'co-admin' || role === 'deputy') return 'Phó nhóm';
    return 'Thành viên';
};

export default function ConversationInfoModal({
    visible,
    conversationId,
    name,
    avatarUri,
    isGroup,
    onClose,
    onConversationDeleted,
}: ConversationInfoModalProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const translateX = useRef(new Animated.Value(windowWidth)).current;
    const [conversation, setConversation] =
        useState<ConversationResponse | null>(null);
    const [shouldRender, setShouldRender] = useState(visible);
    const shouldRenderRef = useRef(visible);
    const [groupMembers, setGroupMembers] = useState<GroupMemberItem[]>([]);
    const [mediaItems, setMediaItems] = useState<ConversationMediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [autoDeleteDuration, setAutoDeleteDuration] = useState(0);
    const [iAmTheBlocker, setIAmTheBlocker] = useState(false);
    const [passwordMode, setPasswordMode] = useState<PasswordMode>(null);
    const [password, setPassword] = useState('');
    const [groupManagementVisible, setGroupManagementVisible] = useState(false);
    const [groupNameDialogVisible, setGroupNameDialogVisible] = useState(false);
    const [groupNameInput, setGroupNameInput] = useState('');

    const groupMode = isGroup || conversation?.type === 'GROUP';
    const displayName = String(
        groupMode && conversation?.groupInfo?.groupName
            ? conversation.groupInfo.groupName
            : name,
    );
    const displayAvatar = toAbsoluteUrl(
        groupMode && conversation?.groupInfo?.groupAvatar
            ? conversation.groupInfo.groupAvatar
            : avatarUri,
    );
    const memberCount = groupMembers.length || conversation?.participants?.length || 0;
    const myRole = conversation?.myRole || groupMembers.find((m) => m.isMe)?.role;
    const isOwner = myRole === 'admin' || myRole === 'leader';
    const canManageGroup =
        myRole === 'admin' ||
        myRole === 'leader' ||
        myRole === 'co-admin' ||
        myRole === 'deputy';
    const isHidden = !!conversation?.myIsHidden;

    const imageItems = useMemo(
        () =>
            mediaItems
                .filter(
                    (item) =>
                        !item.isRevoked &&
                        item.mediaUrl &&
                        (item.fileCategory === 'image' ||
                            item.mimeType?.startsWith('image/') ||
                            item.messageType?.toLowerCase() === 'image'),
                )
                .slice(0, 6),
        [mediaItems],
    );

    useEffect(() => {
        if (visible) {
            shouldRenderRef.current = true;
            setShouldRender(true);
            translateX.setValue(windowWidth);
            Animated.timing(translateX, {
                toValue: 0,
                duration: 240,
                useNativeDriver: true,
            }).start();
            return;
        }

        if (shouldRenderRef.current) {
            Animated.timing(translateX, {
                toValue: windowWidth,
                duration: 220,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    shouldRenderRef.current = false;
                    setShouldRender(false);
                }
            });
        }
    }, [translateX, visible, windowWidth]);

    const handleClose = useCallback(() => {
        Animated.timing(translateX, {
            toValue: windowWidth,
            duration: 220,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                shouldRenderRef.current = false;
                setShouldRender(false);
                onClose();
            }
        });
    }, [onClose, translateX, windowWidth]);

    const refreshData = useCallback(async () => {
        if (!conversationId) return;

        setLoading(true);
        try {
            const nextConversation =
                await chatApi.getConversation(conversationId);
            setConversation(nextConversation);
            setIsPinned(!!nextConversation.myIsPinned);
            setAutoDeleteDuration(
                Number(nextConversation.autoDeleteDuration || 0),
            );

            const shouldLoadGroup =
                isGroup || nextConversation.type === 'GROUP';
            const [mediaResult, membersResult, blockResult] =
                await Promise.allSettled([
                    chatApi.getConversationMedia(conversationId, undefined, 30),
                    shouldLoadGroup
                        ? chatApi.getGroupMembers(conversationId)
                        : Promise.resolve({ items: [] as GroupMemberItem[] }),
                    shouldLoadGroup
                        ? Promise.resolve(null)
                        : chatApi.getBlockStatus(conversationId),
                ]);

            if (mediaResult.status === 'fulfilled') {
                setMediaItems(mediaResult.value.items || []);
            }
            if (membersResult.status === 'fulfilled') {
                setGroupMembers(membersResult.value.items || []);
            }
            if (blockResult.status === 'fulfilled' && blockResult.value) {
                setIAmTheBlocker(
                    !!(
                        blockResult.value.iAmTheBlocker ||
                        blockResult.value.canUnblock
                    ),
                );
            } else {
                setIAmTheBlocker(false);
            }
        } catch (error) {
            Alert.alert(
                'Không tải được thông tin hội thoại',
                error instanceof Error ? error.message : 'Vui lòng thử lại sau',
            );
        } finally {
            setLoading(false);
        }
    }, [conversationId, isGroup]);

    useEffect(() => {
        if (visible) {
            void refreshData();
        } else {
            setPasswordMode(null);
            setPassword('');
            setGroupManagementVisible(false);
            setGroupNameDialogVisible(false);
            setGroupNameInput('');
        }
    }, [refreshData, visible]);

    const runAction = useCallback(
        async (action: () => Promise<void>, successMessage?: string) => {
            setActionLoading(true);
            try {
                await action();
                if (successMessage) Alert.alert('Thành công', successMessage);
            } catch (error) {
                Alert.alert(
                    'Không thể thực hiện',
                    error instanceof Error
                        ? error.message
                        : 'Vui lòng thử lại sau',
                );
            } finally {
                setActionLoading(false);
            }
        },
        [],
    );

    const confirmAction = useCallback(
        (title: string, message: string, action: () => Promise<void>) => {
            Alert.alert(title, message, [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đồng ý',
                    style: 'destructive',
                    onPress: () => void runAction(action),
                },
            ]);
        },
        [runAction],
    );

    const handleTogglePin = () => {
        void runAction(async () => {
            const next = !isPinned;
            setIsPinned(next);
            try {
                if (next) {
                    await chatApi.pinConversation(conversationId);
                } else {
                    await chatApi.unpinConversation(conversationId);
                }
            } catch (error) {
                setIsPinned(!next);
                throw error;
            }
        });
    };

    const handleAutoDelete = () => {
        Alert.alert(
            'Tin nhắn tự xóa',
            'Chọn thời gian tự xóa tin nhắn cho hội thoại này.',
            [
                ...AUTO_DELETE_OPTIONS.map((option) => ({
                    text: option.label,
                    onPress: () =>
                        void runAction(async () => {
                            if (groupMode) {
                                await chatApi.updateGroupAutoDelete(
                                    conversationId,
                                    option.value,
                                );
                            } else {
                                await chatApi.updateAutoDeleteDuration(
                                    conversationId,
                                    option.value,
                                );
                            }
                            setAutoDeleteDuration(option.value);
                        }),
                })),
                { text: 'Hủy', style: 'cancel' as const },
            ],
        );
    };

    const handlePasswordSubmit = () => {
        const trimmed = password.trim();
        if (!passwordMode || !trimmed) return;

        void runAction(async () => {
            if (passwordMode === 'hide') {
                await chatApi.hideConversation(conversationId, trimmed);
                setConversation((prev) =>
                    prev ? { ...prev, myIsHidden: true } : prev,
                );
                onConversationDeleted?.(conversationId);
                onClose();
            } else {
                await chatApi.unhideConversation(conversationId, trimmed);
                setConversation((prev) =>
                    prev ? { ...prev, myIsHidden: false } : prev,
                );
            }
            setPasswordMode(null);
            setPassword('');
        }, passwordMode === 'hide' ? undefined : 'Đã bỏ ẩn hội thoại');
    };

    const handleClearHistory = () => {
        confirmAction(
            'Xóa lịch sử trò chuyện',
            `Xóa toàn bộ lịch sử trò chuyện với ${displayName}?`,
            async () => {
                await chatApi.clearConversationHistory(conversationId);
                onClose();
            },
        );
    };

    const handleDeleteConversation = () => {
        confirmAction(
            'Xóa cuộc hội thoại',
            `Xóa cuộc hội thoại với ${displayName}?`,
            async () => {
                await chatApi.deleteConversation(conversationId);
                onConversationDeleted?.(conversationId);
                onClose();
            },
        );
    };

    const handleBlockToggle = () => {
        confirmAction(
            iAmTheBlocker ? 'Bỏ chặn người dùng' : 'Chặn người dùng',
            iAmTheBlocker
                ? `Bỏ chặn ${displayName}?`
                : `${displayName} sẽ không thể nhắn tin hoặc gọi cho bạn.`,
            async () => {
                if (iAmTheBlocker) {
                    await chatApi.unblockUser(conversationId);
                    setIAmTheBlocker(false);
                } else {
                    await chatApi.blockUser(conversationId);
                    setIAmTheBlocker(true);
                }
            },
        );
    };

    const handleLeaveGroup = () => {
        confirmAction('Rời nhóm', `Rời khỏi nhóm ${displayName}?`, async () => {
            await chatApi.leaveGroup(conversationId);
            onConversationDeleted?.(conversationId);
            onClose();
        });
    };

    const handleDissolveGroup = () => {
        confirmAction(
            'Giải tán nhóm',
            `Giải tán nhóm ${displayName}? Tất cả thành viên sẽ mất quyền truy cập nhóm.`,
            async () => {
                await chatApi.dissolveGroup(conversationId);
                onConversationDeleted?.(conversationId);
                onClose();
            },
        );
    };

    const handleCopyConversationId = () => {
        void runAction(
            async () => {
                await Clipboard.setStringAsync(conversationId);
            },
            'Đã sao chép ID nhóm',
        );
    };

    const openGroupNameDialog = () => {
        setGroupNameInput(displayName);
        setGroupNameDialogVisible(true);
    };

    const handleUpdateGroupName = () => {
        const nextName = groupNameInput.trim();
        if (!nextName) {
            Alert.alert('Tên nhóm không hợp lệ', 'Vui lòng nhập tên nhóm.');
            return;
        }

        void runAction(async () => {
            const result = await chatApi.updateGroupName(
                conversationId,
                nextName,
            );
            setConversation((prev) =>
                prev
                    ? {
                          ...prev,
                          groupInfo: {
                              ...(prev.groupInfo || {}),
                              groupName: result.groupName || nextName,
                          },
                      }
                    : prev,
            );
            setGroupNameDialogVisible(false);
        }, 'Đã đổi tên nhóm');
    };

    const handleUpdateGroupAvatar = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'Chưa có quyền truy cập ảnh',
                'Vui lòng cấp quyền thư viện ảnh để đổi ảnh nhóm.',
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });

        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('file', {
            uri: asset.uri,
            name: asset.fileName || `group-avatar-${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',
        } as any);

        void runAction(async () => {
            const response = await chatApi.updateGroupAvatar(
                conversationId,
                formData,
            );
            setConversation((prev) =>
                prev
                    ? {
                          ...prev,
                          groupInfo: {
                              ...(prev.groupInfo || {}),
                              groupAvatar: response.groupAvatar,
                          },
                      }
                    : prev,
            );
        }, 'Đã đổi ảnh nhóm');
    };

    const canModifyMember = (member: GroupMemberItem) => {
        if (member.isMe || !canManageGroup) return false;
        if (isOwner) return true;
        return member.role === 'member';
    };

    const handleMemberAction = (member: GroupMemberItem) => {
        if (!canModifyMember(member)) return;

        const actions = [
            member.role === 'member'
                ? {
                      text: 'Cấp phó nhóm',
                      onPress: () =>
                          void runAction(async () => {
                              await chatApi.updateGroupMemberRole(
                                  conversationId,
                                  member.userId,
                                  'co-admin',
                              );
                              await refreshData();
                          }, 'Đã cấp phó nhóm'),
                  }
                : null,
            member.role === 'co-admin' && isOwner
                ? {
                      text: 'Hạ xuống thành viên',
                      onPress: () =>
                          void runAction(async () => {
                              await chatApi.updateGroupMemberRole(
                                  conversationId,
                                  member.userId,
                                  'member',
                              );
                              await refreshData();
                          }, 'Đã cập nhật vai trò'),
                  }
                : null,
            {
                text: 'Xóa khỏi nhóm',
                style: 'destructive' as const,
                onPress: () =>
                    confirmAction(
                        'Xóa thành viên',
                        `Xóa ${member.fullName || 'thành viên này'} khỏi nhóm?`,
                        async () => {
                            await chatApi.removeGroupMember(
                                conversationId,
                                member.userId,
                            );
                            await refreshData();
                        },
                    ),
            },
            { text: 'Hủy', style: 'cancel' as const },
        ].filter(Boolean) as {
            text: string;
            style?: 'default' | 'cancel' | 'destructive';
            onPress?: () => void;
        }[];

        Alert.alert(
            member.fullName || 'Thành viên',
            getRoleLabel(member.role),
            actions,
        );
    };

    if (!shouldRender) return null;

    return (
        <Modal
            visible={shouldRender}
            transparent
            animationType="none"
            presentationStyle="fullScreen"
            onRequestClose={handleClose}
        >
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    transform: [{ translateX }],
                    paddingTop: Math.max(
                        insets.top,
                        Platform.OS === 'ios' ? 44 : 0,
                    ),
                    paddingBottom: insets.bottom,
                }}
            >
                <View
                    style={{
                        height: 52,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.divider,
                    }}
                >
                    <TouchableOpacity onPress={handleClose} hitSlop={8}>
                        <Ionicons
                            name="chevron-back"
                            size={26}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: 17,
                            fontWeight: '700',
                        }}
                    >
                        Thông tin hội thoại
                    </Text>
                    <View style={{ width: 26 }} />
                </View>

                {loading ? (
                    <View
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ActivityIndicator size="large" color={LOGIN_PRIMARY} />
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View
                            style={{
                                alignItems: 'center',
                                paddingHorizontal: 16,
                                paddingTop: 24,
                                paddingBottom: 22,
                            }}
                        >
                            {displayAvatar ? (
                                <Image
                                    source={{ uri: displayAvatar }}
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 36,
                                        marginBottom: 12,
                                    }}
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 36,
                                        backgroundColor: LOGIN_PRIMARY,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontSize: 22,
                                            fontWeight: '800',
                                        }}
                                    >
                                        {displayName
                                            .split(' ')
                                            .map((word) => word[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)}
                                    </Text>
                                </View>
                            )}
                            <Text
                                style={{
                                    color: colors.text,
                                    fontSize: 18,
                                    fontWeight: '700',
                                }}
                                numberOfLines={1}
                            >
                                {displayName}
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-around',
                                    width: '100%',
                                    marginTop: 28,
                                }}
                            >
                                <QuickAction
                                    icon="notifications-off-outline"
                                    label="Tắt thông báo"
                                />
                                <QuickAction
                                    icon={isPinned ? 'pin' : 'pin-outline'}
                                    label={isPinned ? 'Bỏ ghim' : 'Ghim hội thoại'}
                                    onPress={handleTogglePin}
                                />
                                <QuickAction
                                    icon={groupMode ? 'settings-outline' : 'people-outline'}
                                    onPress={
                                        groupMode
                                            ? () => setGroupManagementVisible(true)
                                            : undefined
                                    }
                                    label={groupMode ? 'Quản lý nhóm' : 'Tạo nhóm'}
                                />
                            </View>
                        </View>

                        <Section title={groupMode ? 'Thành viên' : 'Images'}>
                            {groupMode ? (
                                <>
                                    <InfoRow
                                        icon="account-multiple-outline"
                                        title={`${memberCount} thành viên`}
                                        subtitle={
                                            myRole ? `Vai trò của bạn: ${myRole}` : undefined
                                        }
                                    />
                                    <InfoRow
                                        icon="pencil-outline"
                                        title="Đổi tên nhóm"
                                        showChevron
                                        onPress={openGroupNameDialog}
                                    />
                                    <InfoRow
                                        icon="camera-outline"
                                        title="Đổi ảnh nhóm"
                                        showChevron
                                        onPress={() => void handleUpdateGroupAvatar()}
                                    />
                                    <InfoRow
                                        icon="account-cog-outline"
                                        title="Quản lý nhóm"
                                        subtitle={getRoleLabel(myRole)}
                                        showChevron
                                        onPress={() => setGroupManagementVisible(true)}
                                    />
                                    <TouchableOpacity
                                        onPress={handleCopyConversationId}
                                        activeOpacity={0.75}
                                        style={{
                                            marginHorizontal: 16,
                                            marginTop: 8,
                                            padding: 12,
                                            borderRadius: 10,
                                            backgroundColor:
                                                colors.backgroundSecondary,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 10,
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name="link-variant"
                                            size={22}
                                            color={colors.textSecondary}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text
                                                style={{
                                                    color: colors.text,
                                                    fontWeight: '600',
                                                }}
                                            >
                                                Link tham gia nhóm
                                            </Text>
                                            <Text
                                                style={{
                                                    color: LOGIN_PRIMARY,
                                                    fontSize: 12,
                                                    marginTop: 2,
                                                }}
                                                numberOfLines={1}
                                            >
                                                {conversationId}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons
                                            name="content-copy"
                                            size={20}
                                            color={colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </>
                            ) : imageItems.length ? (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        gap: 8,
                                        paddingHorizontal: 16,
                                        paddingTop: 8,
                                    }}
                                >
                                    {imageItems.map((item) => (
                                        <Image
                                            key={
                                                item.messageId ||
                                                item._id ||
                                                item.mediaUrl
                                            }
                                            source={{
                                                uri: toAbsoluteUrl(item.mediaUrl),
                                            }}
                                            style={{
                                                width: 78,
                                                height: 78,
                                                borderRadius: 8,
                                                backgroundColor:
                                                    colors.backgroundSecondary,
                                            }}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: colors.textSecondary,
                                        paddingVertical: 22,
                                    }}
                                >
                                    Không có hình ảnh
                                </Text>
                            )}
                        </Section>

                        <Section title={groupMode ? 'Bảng tin nhóm' : 'Bảng tin'}>
                            <InfoRow
                                icon="alarm-check"
                                title="Danh sách nhắc hẹn"
                            />
                            <InfoRow
                                icon="notebook-outline"
                                title="Ghi chú, ghim, bình chọn"
                            />
                        </Section>

                        <Section title="Thiết lập bảo mật">
                            <InfoRow
                                icon="timer-outline"
                                title="Tin nhắn tự xóa"
                                subtitle={getAutoDeleteLabel(autoDeleteDuration)}
                                showChevron
                                onPress={handleAutoDelete}
                            />
                            <InfoRow
                                icon="eye-off-outline"
                                title={
                                    isHidden ? 'Bỏ ẩn trò chuyện' : 'Ẩn trò chuyện'
                                }
                                showChevron
                                onPress={() => {
                                    setPasswordMode(isHidden ? 'reveal' : 'hide');
                                    setPassword('');
                                }}
                            />
                        </Section>

                        <Section>
                            <DangerRow
                                icon="alert-box-outline"
                                title="Báo xấu"
                                muted
                            />
                            <DangerRow
                                icon="delete-outline"
                                title="Xóa lịch sử trò chuyện"
                                onPress={handleClearHistory}
                            />
                            {groupMode ? (
                                <>
                                    <DangerRow
                                        icon="logout"
                                        title="Rời nhóm"
                                        onPress={handleLeaveGroup}
                                    />
                                    {isOwner ? (
                                        <DangerRow
                                            icon="trash-can-outline"
                                            title="Giải tán nhóm"
                                            onPress={handleDissolveGroup}
                                        />
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <DangerRow
                                        icon="delete-outline"
                                        title="Xóa cuộc hội thoại"
                                        onPress={handleDeleteConversation}
                                    />
                                    <DangerRow
                                        icon={
                                            iAmTheBlocker
                                                ? 'lock-open-outline'
                                                : 'block-helper'
                                        }
                                        title={
                                            iAmTheBlocker
                                                ? 'Bỏ chặn người dùng'
                                                : 'Chặn người dùng'
                                        }
                                        onPress={handleBlockToggle}
                                    />
                                </>
                            )}
                        </Section>
                    </ScrollView>
                )}

                {actionLoading ? (
                    <View
                        pointerEvents="auto"
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.12)',
                        }}
                    >
                        <ActivityIndicator size="large" color={LOGIN_PRIMARY} />
                    </View>
                ) : null}

                <PasswordDialog
                    visible={!!passwordMode}
                    mode={passwordMode}
                    value={password}
                    onChangeText={setPassword}
                    onCancel={() => {
                        setPasswordMode(null);
                        setPassword('');
                    }}
                    onSubmit={handlePasswordSubmit}
                />
                <GroupNameDialog
                    visible={groupNameDialogVisible}
                    value={groupNameInput}
                    onChangeText={setGroupNameInput}
                    onCancel={() => setGroupNameDialogVisible(false)}
                    onSubmit={handleUpdateGroupName}
                />
                <GroupManagementModalV2
                    visible={groupManagementVisible}
                    conversationId={conversationId}
                    members={groupMembers}
                    canManage={canManageGroup}
                    isOwner={isOwner}
                    onClose={() => setGroupManagementVisible(false)}
                    onMemberPress={handleMemberAction}
                    onCopyLink={handleCopyConversationId}
                    onDissolveGroup={handleDissolveGroup}
                />
            </Animated.View>
        </Modal>
    );
}

function PasswordDialog({
    visible,
    mode,
    value,
    onChangeText,
    onCancel,
    onSubmit,
}: {
    visible: boolean;
    mode: PasswordMode;
    value: string;
    onChangeText: (value: string) => void;
    onCancel: () => void;
    onSubmit: () => void;
}) {
    const { colors } = useTheme();
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onCancel}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: 24,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                }}
            >
                <View
                    style={{
                        borderRadius: 12,
                        backgroundColor: colors.background,
                        padding: 18,
                    }}
                >
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: 17,
                            fontWeight: '700',
                            marginBottom: 8,
                        }}
                    >
                        {mode === 'reveal'
                            ? 'Nhập mật khẩu để bỏ ẩn'
                            : 'Đặt mật khẩu để ẩn hội thoại'}
                    </Text>
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        secureTextEntry
                        placeholder="Mật khẩu"
                        placeholderTextColor={colors.textSecondary}
                        style={{
                            borderWidth: 1,
                            borderColor: colors.divider,
                            borderRadius: 10,
                            color: colors.text,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            marginTop: 8,
                        }}
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            gap: 12,
                            marginTop: 16,
                        }}
                    >
                        <TouchableOpacity onPress={onCancel}>
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontWeight: '700',
                                }}
                            >
                                Hủy
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSubmit}>
                            <Text
                                style={{
                                    color: LOGIN_PRIMARY,
                                    fontWeight: '800',
                                }}
                            >
                                Xác nhận
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function GroupNameDialog({
    visible,
    value,
    onChangeText,
    onCancel,
    onSubmit,
}: {
    visible: boolean;
    value: string;
    onChangeText: (value: string) => void;
    onCancel: () => void;
    onSubmit: () => void;
}) {
    const { colors } = useTheme();
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onCancel}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: 24,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                }}
            >
                <View
                    style={{
                        borderRadius: 12,
                        backgroundColor: colors.background,
                        padding: 18,
                    }}
                >
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: 17,
                            fontWeight: '700',
                            marginBottom: 8,
                        }}
                    >
                        Đổi tên nhóm
                    </Text>
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder="Tên nhóm"
                        placeholderTextColor={colors.textSecondary}
                        style={{
                            borderWidth: 1,
                            borderColor: colors.divider,
                            borderRadius: 10,
                            color: colors.text,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            marginTop: 8,
                        }}
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            gap: 12,
                            marginTop: 16,
                        }}
                    >
                        <TouchableOpacity onPress={onCancel}>
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontWeight: '700',
                                }}
                            >
                                Hủy
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSubmit}>
                            <Text
                                style={{
                                    color: LOGIN_PRIMARY,
                                    fontWeight: '800',
                                }}
                            >
                                Lưu
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function GroupManagementModalV2({
    visible,
    conversationId,
    members,
    canManage,
    isOwner,
    onClose,
    onMemberPress,
    onCopyLink,
    onDissolveGroup,
}: {
    visible: boolean;
    conversationId: string;
    members: GroupMemberItem[];
    canManage: boolean;
    isOwner: boolean;
    onClose: () => void;
    onMemberPress: (member: GroupMemberItem) => void;
    onCopyLink: () => void;
    onDissolveGroup: () => void;
}) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [showMembers, setShowMembers] = useState(false);
    const [showJoinRequests, setShowJoinRequests] = useState(false);
    const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
    const [memberLimit, setMemberLimit] = useState(10);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [permissions, setPermissions] = useState({
        changeNameAvatar: true,
        pinMessages: true,
        createNotes: true,
        createPolls: true,
        sendMessages: true,
    });
    const [settings, setSettings] = useState({
        approveNewMembers: false,
        markLeaderMessages: true,
        allowReadRecentMessages: true,
        allowJoinLink: true,
    });
    const groupLink = `zalo.me/g/${conversationId}`;

    useEffect(() => {
        if (!visible || !conversationId) return;

        let active = true;
        void chatApi
            .getGroupDetail(conversationId)
            .then((detail) => {
                if (!active) return;
                setSettings((prev) => ({
                    ...prev,
                    approveNewMembers: !!detail.joinRequireApproval,
                }));
                setMemberLimit(detail.memberLimit || 10);
            })
            .catch(() => undefined);

        return () => {
            active = false;
        };
    }, [conversationId, visible]);

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSetting = (key: keyof typeof settings) => {
        const nextValue = !settings[key];
        setSettings((prev) => ({ ...prev, [key]: nextValue }));

        if (key === 'approveNewMembers') {
            void chatApi.updateGroupJoinApproval(conversationId, nextValue).catch(
                () => {
                    setSettings((prev) => ({ ...prev, [key]: !nextValue }));
                    Alert.alert('Không thể cập nhật', 'Vui lòng thử lại sau.');
                },
            );
        }
    };

    const loadJoinRequests = async () => {
        setLoadingRequests(true);
        try {
            const response = await chatApi.getGroupJoinRequests(conversationId);
            const items = Array.isArray(response)
                ? response
                : response.items || [];
            setJoinRequests(items.filter((item) => item.status === 'pending'));
            setShowJoinRequests(true);
        } catch (error) {
            Alert.alert(
                'Không tải được yêu cầu tham gia',
                error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
            );
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleJoinRequest = (
        request: GroupJoinRequest,
        approved: boolean,
    ) => {
        const action = approved
            ? chatApi.approveGroupJoinRequest
            : chatApi.rejectGroupJoinRequest;

        void action(conversationId, request.requestId)
            .then(() => {
                setJoinRequests((prev) =>
                    prev.filter((item) => item.requestId !== request.requestId),
                );
                Alert.alert(
                    'Thành công',
                    approved
                        ? 'Đã duyệt yêu cầu tham gia.'
                        : 'Đã từ chối yêu cầu tham gia.',
                );
            })
            .catch((error) => {
                Alert.alert(
                    'Không thể thực hiện',
                    error instanceof Error
                        ? error.message
                        : 'Vui lòng thử lại sau.',
                );
            });
    };

    const shareGroupLink = () => {
        void Share.share({ message: groupLink }).catch(() => undefined);
    };

    const refreshGroupLink = () => {
        Alert.alert(
            'Chưa hỗ trợ làm mới link',
            'Backend hiện tại chưa có endpoint tạo lại link nhóm.',
        );
    };

    const renderShell = (children: React.ReactNode, title = 'Quản lý nhóm') => (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={
                showJoinRequests
                    ? () => setShowJoinRequests(false)
                    : showMembers
                      ? () => setShowMembers(false)
                      : onClose
            }
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    paddingTop: Math.max(
                        insets.top,
                        Platform.OS === 'ios' ? 44 : 0,
                    ),
                    paddingBottom: insets.bottom,
                }}
            >
                <HeaderBar
                    title={title}
                    onBack={
                        showJoinRequests
                            ? () => setShowJoinRequests(false)
                            : showMembers
                              ? () => setShowMembers(false)
                              : onClose
                    }
                />
                {children}
            </View>
        </Modal>
    );

    if (showJoinRequests) {
        return renderShell(
            <ScrollView showsVerticalScrollIndicator={false}>
                {loadingRequests ? (
                    <View style={{ paddingVertical: 28 }}>
                        <ActivityIndicator color={LOGIN_PRIMARY} />
                    </View>
                ) : joinRequests.length ? (
                    joinRequests.map((request) => (
                        <JoinRequestRow
                            key={request.requestId}
                            request={request}
                            onApprove={() => handleJoinRequest(request, true)}
                            onReject={() => handleJoinRequest(request, false)}
                        />
                    ))
                ) : (
                    <Text
                        style={{
                            color: colors.textSecondary,
                            textAlign: 'center',
                            paddingVertical: 28,
                        }}
                    >
                        Không có yêu cầu tham gia
                    </Text>
                )}
            </ScrollView>,
            'Yêu cầu tham gia',
        );
    }

    if (showMembers) {
        return renderShell(
            <ScrollView showsVerticalScrollIndicator={false}>
                {members.map((member) => (
                    <MemberManagementRow
                        key={member.userId}
                        member={member}
                        canManage={canManage}
                        onPress={() => onMemberPress(member)}
                    />
                ))}
            </ScrollView>,
            'Trưởng & phó nhóm',
        );
    }

    return renderShell(
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
        >
            <View style={{ paddingVertical: 16 }}>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: '700',
                        paddingHorizontal: 16,
                        marginBottom: 12,
                    }}
                >
                    Cho phép các thành viên trong nhóm:
                </Text>
                <PermissionRow
                    title="Thay đổi tên & ảnh đại diện của nhóm"
                    checked={permissions.changeNameAvatar}
                    onPress={() => togglePermission('changeNameAvatar')}
                />
                <PermissionRow
                    title="Ghim tin nhắn, ghi chú, bình chọn lên đầu hội thoại"
                    checked={permissions.pinMessages}
                    onPress={() => togglePermission('pinMessages')}
                />
                <PermissionRow
                    title="Tạo mới ghi chú, nhắc hẹn"
                    checked={permissions.createNotes}
                    onPress={() => togglePermission('createNotes')}
                />
                <PermissionRow
                    title="Tạo mới bình chọn"
                    checked={permissions.createPolls}
                    onPress={() => togglePermission('createPolls')}
                />
                <PermissionRow
                    title="Gửi tin nhắn"
                    checked={permissions.sendMessages}
                    onPress={() => togglePermission('sendMessages')}
                />
            </View>

            <View
                style={{
                    borderTopWidth: 0.5,
                    borderBottomWidth: 0.5,
                    borderColor: colors.divider,
                    paddingVertical: 8,
                }}
            >
                <SettingSwitchRow
                    title="Chế độ phê duyệt thành viên mới"
                    value={settings.approveNewMembers}
                    onValueChange={() => toggleSetting('approveNewMembers')}
                    disabled={!canManage}
                />
                <SettingSwitchRow
                    title="Đánh dấu tin nhắn từ trưởng/phó nhóm"
                    value={settings.markLeaderMessages}
                    onValueChange={() => toggleSetting('markLeaderMessages')}
                />
                <SettingSwitchRow
                    title="Cho phép thành viên mới đọc tin nhắn gần nhất"
                    value={settings.allowReadRecentMessages}
                    onValueChange={() =>
                        toggleSetting('allowReadRecentMessages')
                    }
                />
                <SettingSwitchRow
                    title="Cho phép dùng link tham gia nhóm"
                    value={settings.allowJoinLink}
                    onValueChange={() => toggleSetting('allowJoinLink')}
                />
            </View>

            <View
                style={{
                    minHeight: 82,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.divider,
                }}
            >
                <Text
                    style={{
                        color: LOGIN_PRIMARY,
                        flex: 1,
                        fontSize: 14,
                    }}
                    numberOfLines={1}
                >
                    {groupLink}
                </Text>
                <TouchableOpacity onPress={onCopyLink} hitSlop={8}>
                    <MaterialCommunityIcons
                        name="content-copy"
                        size={22}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={shareGroupLink}
                    hitSlop={8}
                    style={{ marginLeft: 18 }}
                >
                    <MaterialCommunityIcons
                        name="share-outline"
                        size={23}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={refreshGroupLink}
                    hitSlop={8}
                    style={{ marginLeft: 18 }}
                >
                    <MaterialCommunityIcons
                        name="refresh"
                        size={24}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            <View
                style={{
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.divider,
                }}
            >
                <ManagementMenuRow
                    icon="account-multiple-outline"
                    onPress={() => setShowMembers(true)}
                    title="Chặn khỏi nhóm"
                />
                <ManagementMenuRow
                    icon="key-outline"
                    title={`Trưởng & phó nhóm (${members.length}/${memberLimit})`}
                    onPress={() => setShowMembers(true)}
                />
                {canManage && settings.approveNewMembers ? (
                    <ManagementMenuRow
                        icon="account-clock-outline"
                        title="Yêu cầu tham gia"
                        onPress={() => void loadJoinRequests()}
                    />
                ) : null}
            </View>

            <View style={{ flex: 1 }} />
            <TouchableOpacity
                onPress={isOwner ? onDissolveGroup : undefined}
                activeOpacity={isOwner ? 0.75 : 1}
                style={{
                    marginHorizontal: 16,
                    marginTop: 120,
                    marginBottom: 18,
                    minHeight: 44,
                    borderRadius: 7,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isOwner ? '#fde8ea' : '#f3f4f6',
                }}
            >
                <Text
                    style={{
                        color: isOwner ? '#e11d48' : colors.textSecondary,
                        fontWeight: '700',
                        fontSize: 16,
                    }}
                >
                    Giải tán nhóm
                </Text>
            </TouchableOpacity>
        </ScrollView>,
    );
}

function HeaderBar({
    title,
    onBack,
}: {
    title: string;
    onBack: () => void;
}) {
    const { colors } = useTheme();
    return (
        <View
            style={{
                height: 52,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 0.5,
                borderBottomColor: colors.divider,
            }}
        >
            <TouchableOpacity onPress={onBack} hitSlop={8}>
                <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text
                style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: '700',
                }}
            >
                {title}
            </Text>
            <View style={{ width: 26 }} />
        </View>
    );
}

function PermissionRow({
    title,
    checked,
    onPress,
}: {
    title: string;
    checked: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={{
                minHeight: 42,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
            }}
        >
            <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>
                {title}
            </Text>
            <MaterialCommunityIcons
                name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={25}
                color={checked ? LOGIN_PRIMARY : colors.textSecondary}
            />
        </TouchableOpacity>
    );
}

function SettingSwitchRow({
    title,
    value,
    disabled,
    onValueChange,
}: {
    title: string;
    value: boolean;
    disabled?: boolean;
    onValueChange: () => void;
}) {
    const { colors } = useTheme();
    return (
        <View
            style={{
                minHeight: 50,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: disabled ? 0.55 : 1,
            }}
        >
            <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>
                {title}
            </Text>
            <MaterialCommunityIcons
                name="help-circle-outline"
                size={17}
                color={colors.textSecondary}
            />
            <Switch
                value={value}
                disabled={disabled}
                onValueChange={onValueChange}
                trackColor={{ false: '#d1d5db', true: LOGIN_PRIMARY }}
                thumbColor="#fff"
            />
        </View>
    );
}

function ManagementMenuRow({
    icon,
    title,
    onPress,
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    onPress?: () => void;
}) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.75 : 1}
            style={{
                minHeight: 48,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
            }}
        >
            <MaterialCommunityIcons
                name={icon}
                size={23}
                color={colors.textSecondary}
            />
            <Text style={{ color: colors.text, fontSize: 15 }}>{title}</Text>
        </TouchableOpacity>
    );
}

function MemberManagementRow({
    member,
    canManage,
    onPress,
}: {
    member: GroupMemberItem;
    canManage: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={canManage && !member.isMe ? 0.75 : 1}
            style={{
                minHeight: 70,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.divider,
            }}
        >
            {member.avatarUrl ? (
                <Image
                    source={{ uri: toAbsoluteUrl(member.avatarUrl) }}
                    style={{ width: 46, height: 46, borderRadius: 23 }}
                />
            ) : (
                <View
                    style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        backgroundColor: LOGIN_PRIMARY,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>
                        {(member.fullName || '?')
                            .split(' ')
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                    </Text>
                </View>
            )}
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        color: colors.text,
                        fontWeight: '700',
                        fontSize: 15,
                    }}
                    numberOfLines={1}
                >
                    {member.fullName || 'Thành viên'}
                    {member.isMe ? ' (Bạn)' : ''}
                </Text>
                <Text
                    style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        marginTop: 3,
                    }}
                >
                    {getRoleLabel(member.role)}
                </Text>
            </View>
            {canManage && !member.isMe ? (
                <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={24}
                    color={colors.textSecondary}
                />
            ) : null}
        </TouchableOpacity>
    );
}

function JoinRequestRow({
    request,
    onApprove,
    onReject,
}: {
    request: GroupJoinRequest;
    onApprove: () => void;
    onReject: () => void;
}) {
    const { colors } = useTheme();
    return (
        <View
            style={{
                minHeight: 84,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.divider,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
            }}
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: LOGIN_PRIMARY,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text style={{ color: '#fff', fontWeight: '800' }}>
                    {(request.requester.fullName || '?')
                        .split(' ')
                        .map((word) => word[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        color: colors.text,
                        fontWeight: '700',
                        fontSize: 15,
                    }}
                    numberOfLines={1}
                >
                    {request.requester.fullName || 'Người dùng'}
                </Text>
                {request.message ? (
                    <Text
                        style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            marginTop: 3,
                        }}
                        numberOfLines={2}
                    >
                        {request.message}
                    </Text>
                ) : null}
            </View>
            <TouchableOpacity onPress={onReject} hitSlop={8}>
                <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={28}
                    color="#ef4444"
                />
            </TouchableOpacity>
            <TouchableOpacity onPress={onApprove} hitSlop={8}>
                <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={28}
                    color={LOGIN_PRIMARY}
                />
            </TouchableOpacity>
        </View>
    );
}

// Kept temporarily as a fallback for the member-only management view.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GroupManagementModal({
    visible,
    members,
    canManage,
    onClose,
    onMemberPress,
}: {
    visible: boolean;
    members: GroupMemberItem[];
    canManage: boolean;
    onClose: () => void;
    onMemberPress: (member: GroupMemberItem) => void;
}) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 0),
                    paddingBottom: insets.bottom,
                }}
            >
                <View
                    style={{
                        height: 52,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.divider,
                    }}
                >
                    <TouchableOpacity onPress={onClose} hitSlop={8}>
                        <Ionicons
                            name="chevron-back"
                            size={26}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: 17,
                            fontWeight: '700',
                        }}
                    >
                        Quản lý nhóm
                    </Text>
                    <View style={{ width: 26 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text
                        style={{
                            color: colors.textSecondary,
                            paddingHorizontal: 16,
                            paddingTop: 14,
                            paddingBottom: 8,
                            fontSize: 13,
                        }}
                    >
                        {canManage
                            ? 'Chạm vào thành viên để quản lý vai trò hoặc xóa khỏi nhóm.'
                            : 'Bạn không có quyền quản lý thành viên nhóm.'}
                    </Text>
                    {members.map((member) => (
                        <TouchableOpacity
                            key={member.userId}
                            onPress={() => onMemberPress(member)}
                            activeOpacity={canManage && !member.isMe ? 0.75 : 1}
                            style={{
                                minHeight: 70,
                                paddingHorizontal: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                borderBottomWidth: 0.5,
                                borderBottomColor: colors.divider,
                            }}
                        >
                            {member.avatarUrl ? (
                                <Image
                                    source={{
                                        uri: toAbsoluteUrl(member.avatarUrl),
                                    }}
                                    style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 23,
                                    }}
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 23,
                                        backgroundColor: LOGIN_PRIMARY,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontWeight: '800',
                                        }}
                                    >
                                        {(member.fullName || '?')
                                            .split(' ')
                                            .map((word) => word[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)}
                                    </Text>
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: colors.text,
                                        fontWeight: '700',
                                        fontSize: 15,
                                    }}
                                    numberOfLines={1}
                                >
                                    {member.fullName || 'Thành viên'}
                                    {member.isMe ? ' (Bạn)' : ''}
                                </Text>
                                <Text
                                    style={{
                                        color: colors.textSecondary,
                                        fontSize: 12,
                                        marginTop: 3,
                                    }}
                                >
                                    {getRoleLabel(member.role)}
                                </Text>
                            </View>
                            {canManage && !member.isMe ? (
                                <MaterialCommunityIcons
                                    name="dots-horizontal"
                                    size={24}
                                    color={colors.textSecondary}
                                />
                            ) : null}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}

function QuickAction({
    icon,
    label,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
}) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={{ alignItems: 'center', width: 90 }}
        >
            <Ionicons name={icon} size={24} color={LOGIN_PRIMARY} />
            <Text
                style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginTop: 8,
                    textAlign: 'center',
                }}
                numberOfLines={2}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function Section({
    title,
    children,
}: {
    title?: string;
    children: React.ReactNode;
}) {
    const { colors } = useTheme();
    return (
        <View
            style={{
                paddingVertical: 12,
                borderTopWidth: 0.5,
                borderTopColor: colors.divider,
            }}
        >
            {title ? (
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 15,
                        fontWeight: '800',
                        paddingHorizontal: 16,
                        marginBottom: 6,
                    }}
                >
                    {title}
                </Text>
            ) : null}
            {children}
        </View>
    );
}

function InfoRow({
    icon,
    title,
    subtitle,
    showChevron,
    onPress,
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    subtitle?: string;
    showChevron?: boolean;
    onPress?: () => void;
}) {
    const { colors } = useTheme();
    const content = (
        <>
            <MaterialCommunityIcons
                name={icon}
                size={22}
                color={colors.textSecondary}
            />
            <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15 }}>{title}</Text>
                {subtitle ? (
                    <Text
                        style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            marginTop: 2,
                        }}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {showChevron ? (
                <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                />
            ) : null}
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.75}
                style={{
                    minHeight: 48,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    gap: 14,
                }}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return (
        <View
            style={{
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                gap: 14,
            }}
        >
            {content}
        </View>
    );
}

function DangerRow({
    icon,
    title,
    onPress,
    muted,
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    onPress?: () => void;
    muted?: boolean;
}) {
    const { colors } = useTheme();
    const color = muted ? colors.text : '#ef4444';
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={{
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                gap: 14,
            }}
        >
            <MaterialCommunityIcons name={icon} size={22} color={color} />
            <Text style={{ color, fontSize: 15 }}>{title}</Text>
        </TouchableOpacity>
    );
}
