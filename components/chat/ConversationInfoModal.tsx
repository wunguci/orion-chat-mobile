/* eslint-disable */
import { API_BASE_URL } from '@/config/api';
import { useTheme } from '@/hooks/useTheme';
import {
    chatApi,
    ConversationMediaItem,
    ConversationResponse,
    GroupJoinRequest,
    GroupMemberItem,
    PinnedMessageItem,
} from '@/services/api/chat';
import { friendApi, FriendResponse } from '@/services/api/friend';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useRouter } from 'expo-router';

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

const PRIVATE_AUTO_DELETE_OPTIONS = [
    { label: 'Never', value: 0 },
    { label: '1 day', value: 1 },
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
];

const GROUP_AUTO_DELETE_OPTIONS = [
    { label: 'Never', value: 0 },
    { label: '1 hour', value: 3600 },
    { label: '1 day', value: 86400 },
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

const getAutoDeleteLabel = (duration?: number, groupMode?: boolean) =>
    (groupMode ? GROUP_AUTO_DELETE_OPTIONS : PRIVATE_AUTO_DELETE_OPTIONS).find(
        (item) => item.value === Number(duration || 0),
    )
        ?.label || `${duration} days`;

const formatPinnedDate = (value?: string | null) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const getRoleLabel = (role?: string | null) => {
    if (role === 'admin' || role === 'leader') return 'Leader';
    if (role === 'co-admin' || role === 'deputy') return 'Deputy Leader';
    return 'Member';
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
    const LOGIN_PRIMARY = colors.primary;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const translateX = useRef(new Animated.Value(windowWidth)).current;
    const [conversation, setConversation] =
        useState<ConversationResponse | null>(null);
    const [shouldRender, setShouldRender] = useState(visible);
    const shouldRenderRef = useRef(visible);
    const [groupMembers, setGroupMembers] = useState<GroupMemberItem[]>([]);
    const [mediaItems, setMediaItems] = useState<ConversationMediaItem[]>([]);
    const [pinnedMessages, setPinnedMessages] = useState<PinnedMessageItem[]>(
        [],
    );
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [autoDeleteDuration, setAutoDeleteDuration] = useState(0);
    const [iAmTheBlocker, setIAmTheBlocker] = useState(false);
    const [passwordMode, setPasswordMode] = useState<PasswordMode>(null);
    const [password, setPassword] = useState('');
    const [groupManagementVisible, setGroupManagementVisible] = useState(false);
    const [membersVisible, setMembersVisible] = useState(false);
    const [pinnedMessagesVisible, setPinnedMessagesVisible] = useState(false);
    const [groupNameDialogVisible, setGroupNameDialogVisible] = useState(false);
    const [groupNameInput, setGroupNameInput] = useState('');
    const [addMembersVisible, setAddMembersVisible] = useState(false);
    const [transferOwnerVisible, setTransferOwnerVisible] = useState(false);
    const [selectedTransferOwnerId, setSelectedTransferOwnerId] = useState('');

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
    const memberCount =
        groupMembers.length || conversation?.participants?.length || 0;
    const myMember = groupMembers.find((m) => m.isMe);
    const myRole = myMember?.role || conversation?.myRole;
    const isOwner = conversation?.groupInfo?.ownerId
        ? myMember?.userId === conversation.groupInfo.ownerId
        : myRole === 'admin' || myRole === 'leader';
    const canManageGroup =
        myRole === 'admin' ||
        myRole === 'leader' ||
        myRole === 'co-admin' ||
        myRole === 'deputy';
    const isHidden = !!conversation?.myIsHidden;
    const ownerTransferCandidates = useMemo(
        () => groupMembers.filter((member) => !member.isMe),
        [groupMembers],
    );

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
    const mediaPreviewItems = useMemo(
        () =>
            mediaItems
                .filter((item) => !item.isRevoked && item.mediaUrl)
                .slice(0, 5),
        [mediaItems],
    );

    const openMediaManager = useCallback(() => {
        onClose();
        setTimeout(() => {
            router.push({
                pathname: '/chat/media',
                params: {
                    conversationId,
                    name: 'Photos, files, links',
                },
            });
        }, 120);
    }, [conversationId, onClose, router]);

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
            const [mediaResult, membersResult, pinnedResult, blockResult] =
                await Promise.allSettled([
                    chatApi.getConversationMedia(conversationId, undefined, 30),
                    shouldLoadGroup
                        ? chatApi.getGroupMembers(conversationId)
                        : Promise.resolve({ items: [] as GroupMemberItem[] }),
                    chatApi.getPinnedMessages(conversationId),
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
            if (pinnedResult.status === 'fulfilled') {
                setPinnedMessages(pinnedResult.value.items || []);
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
                'Unable to load conversation info',
                error instanceof Error ? error.message : 'Please try again later',
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
            setMembersVisible(false);
            setPinnedMessagesVisible(false);
            setGroupNameDialogVisible(false);
            setGroupNameInput('');
            setAddMembersVisible(false);
            setTransferOwnerVisible(false);
            setSelectedTransferOwnerId('');
        }
    }, [refreshData, visible]);

    const runAction = useCallback(
        async (action: () => Promise<void>, successMessage?: string) => {
            setActionLoading(true);
            try {
                await action();
                if (successMessage) Alert.alert('Success', successMessage);
            } catch (error) {
                Alert.alert(
                    'Unable to perform action',
                    error instanceof Error
                        ? error.message
                        : 'Please try again later',
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
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
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
            'Auto-delete messages',
            'Select the auto-deletion duration for this conversation.',
            [
                ...(groupMode
                    ? GROUP_AUTO_DELETE_OPTIONS
                    : PRIVATE_AUTO_DELETE_OPTIONS
                ).map((option) => ({
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
                { text: 'Cancel', style: 'cancel' as const },
            ],
        );
    };

    const handlePasswordSubmit = () => {
        const trimmed = password.trim();
        if (!passwordMode || !trimmed) return;

        void runAction(
            async () => {
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
            },
            passwordMode === 'hide' ? undefined : 'Conversation unhidden',
        );
    };

    const handleClearHistory = () => {
        confirmAction(
            'Clear chat history',
            `Clear all chat history with ${displayName}?`,
            async () => {
                await chatApi.clearConversationHistory(conversationId);
                onClose();
            },
        );
    };

    const handleDeleteConversation = () => {
        confirmAction(
            'Delete conversation',
            `Delete conversation with ${displayName}?`,
            async () => {
                await chatApi.deleteConversation(conversationId);
                onConversationDeleted?.(conversationId);
                onClose();
            },
        );
    };

    const handleBlockToggle = () => {
        confirmAction(
            iAmTheBlocker ? 'Unblock user' : 'Block user',
            iAmTheBlocker
                ? `Unblock ${displayName}?`
                : `${displayName} will not be able to message or call you.`,
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
        if (isOwner) {
            if (!ownerTransferCandidates.length) {
                Alert.alert(
                    'Cannot leave group',
                    'You are the group leader. You must transfer the leadership to another member before leaving.',
                );
                return;
            }

            setSelectedTransferOwnerId(ownerTransferCandidates[0].userId);
            setTransferOwnerVisible(true);
            return;
        }

        confirmAction('Leave group', `Leave group ${displayName}?`, async () => {
            await chatApi.leaveGroup(conversationId);
            onConversationDeleted?.(conversationId);
            onClose();
        });
    };

    const handleConfirmLeaveGroupWithTransfer = () => {
        const newAdminUserId = selectedTransferOwnerId;
        const newOwner = ownerTransferCandidates.find(
            (member) => member.userId === newAdminUserId,
        );

        if (!newAdminUserId || !newOwner) {
            Alert.alert(
                'New leader not selected',
                'Please select another member as the new leader before leaving.',
            );
            return;
        }

        Alert.alert(
            'Leave group',
            `Transfer group leadership to ${newOwner.fullName || 'this member'} and leave the group ${displayName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: () =>
                        void runAction(async () => {
                            await chatApi.leaveGroup(
                                conversationId,
                                newAdminUserId,
                            );
                            setTransferOwnerVisible(false);
                            setSelectedTransferOwnerId('');
                            onConversationDeleted?.(conversationId);
                            onClose();
                        }),
                },
            ],
        );
    };

    const handleDissolveGroup = () => {
        confirmAction(
            'Disband group',
            `Disband group ${displayName}? All members will lose access to the group.`,
            async () => {
                await chatApi.dissolveGroup(conversationId);
                onConversationDeleted?.(conversationId);
                onClose();
            },
        );
    };

    const handleCopyConversationId = () => {
        void runAction(async () => {
            await Clipboard.setStringAsync(conversationId);
        }, 'Group ID copied');
    };

    const handleUnpinMessage = (messageId: string) => {
        void runAction(async () => {
            await chatApi.unpinMessage(conversationId, messageId);
            setPinnedMessages((prev) =>
                prev.filter((item) => item.messageId !== messageId),
            );
        }, 'Message unpinned');
    };

    const openGroupNameDialog = () => {
        setGroupNameInput(displayName);
        setGroupNameDialogVisible(true);
    };

    const handleUpdateGroupName = () => {
        const nextName = groupNameInput.trim();
        if (!nextName) {
            Alert.alert('Invalid group name', 'Please enter a group name.');
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
        }, 'Group name updated');
    };

    const handleUpdateGroupAvatar = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'No photo library permission',
                'Please grant photo library permission to change the group avatar.',
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
        }, 'Group avatar updated');
    };

    const canModifyMember = (member: GroupMemberItem) => {
        if (member.isMe || !canManageGroup) return false;
        if (isOwner) return true;
        return member.role === 'member';
    };

    const handleMemberAction = (member: GroupMemberItem) => {
        if (!canModifyMember(member)) return;

        const actions = [
            member.role === 'member' && isOwner
                ? {
                      text: 'Promote to deputy',
                      onPress: () =>
                          void runAction(async () => {
                              await chatApi.updateGroupMemberRole(
                                  conversationId,
                                  member.userId,
                                  'co-admin',
                              );
                              await refreshData();
                          }, 'Promoted to deputy'),
                  }
                : null,
            member.role === 'co-admin' && isOwner
                ? {
                      text: 'Demote to member',
                      onPress: () =>
                          void runAction(async () => {
                              await chatApi.updateGroupMemberRole(
                                  conversationId,
                                  member.userId,
                                  'member',
                              );
                              await refreshData();
                          }, 'Role updated'),
                  }
                : null,
            {
                text: 'Remove from group',
                style: 'destructive' as const,
                onPress: () =>
                    confirmAction(
                        'Remove member',
                        `Remove ${member.fullName || 'this member'} from the group?`,
                        async () => {
                            await chatApi.removeGroupMember(
                                conversationId,
                                member.userId,
                            );
                            await refreshData();
                        },
                    ),
            },
            { text: 'Cancel', style: 'cancel' as const },
        ].filter(Boolean) as {
            text: string;
            style?: 'default' | 'cancel' | 'destructive';
            onPress?: () => void;
        }[];

        Alert.alert(
            member.fullName || 'Member',
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
            onRequestClose={handleClose}
        >
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    transform: [{ translateX }],
                    paddingTop: Math.max(
                        insets.top,
                        Platform.OS === 'ios' ? 44 : 24,
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
                        position: 'relative',
                    }}
                >
                    <TouchableOpacity onPress={handleClose} hitSlop={8} style={{ zIndex: 10 }}>
                        <Ionicons
                            name="chevron-back"
                            size={26}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                    <View
                        style={{
                            position: 'absolute',
                            left: 40,
                            right: 40,
                            top: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 17,
                                fontWeight: '700',
                                textAlign: 'center',
                            }}
                            numberOfLines={1}
                        >
                            Conversation Info
                        </Text>
                    </View>
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
                                    label="Mute"
                                />
                                <QuickAction
                                    icon={isPinned ? 'pin' : 'pin-outline'}
                                    label={
                                        isPinned ? 'Unpin' : 'Pin chat'
                                    }
                                    onPress={handleTogglePin}
                                />
                                <QuickAction
                                    icon={
                                        groupMode
                                            ? 'settings-outline'
                                            : 'people-outline'
                                    }
                                    onPress={
                                        groupMode
                                            ? () =>
                                                  setGroupManagementVisible(
                                                      true,
                                                  )
                                            : undefined
                                    }
                                    label={
                                        groupMode ? 'Manage group' : 'Create group'
                                    }
                                />
                            </View>
                        </View>

                        <Section title={groupMode ? 'Members' : 'Images'}>
                            {groupMode ? (
                                <>
                                    <InfoRow
                                        icon="account-multiple-outline"
                                        title={`${memberCount} members`}
                                        subtitle={
                                            myRole
                                                ? `Your role: ${myRole}`
                                                : undefined
                                        }
                                        showChevron
                                        onPress={() => setMembersVisible(true)}
                                    />
                                    <InfoRow
                                        icon="pencil-outline"
                                        title="Change group name"
                                        showChevron
                                        onPress={openGroupNameDialog}
                                    />
                                    <InfoRow
                                        icon="camera-outline"
                                        title="Change group avatar"
                                        showChevron
                                        onPress={() =>
                                            void handleUpdateGroupAvatar()
                                        }
                                    />
                                    <InfoRow
                                        icon="account-cog-outline"
                                        title="Manage group"
                                        subtitle={getRoleLabel(myRole)}
                                        showChevron
                                        onPress={() =>
                                            setGroupManagementVisible(true)
                                        }
                                    />
                                    {canManageGroup ? (
                                        <InfoRow
                                            icon="account-plus-outline"
                                            title="Add members"
                                            showChevron
                                            onPress={() =>
                                                setAddMembersVisible(true)
                                            }
                                        />
                                    ) : null}
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
                                                Group invite link
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
                                                uri: toAbsoluteUrl(
                                                    item.mediaUrl,
                                                ),
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
                                    No images
                                </Text>
                            )}
                        </Section>

                        <Section title="Photos, files, links">
                            <InfoRow
                                icon="folder-multiple-image"
                                title="Photos, files, links"
                                subtitle={
                                    mediaPreviewItems.length
                                        ? `${mediaPreviewItems.length} recent items`
                                        : 'No content'
                                }
                                showChevron
                                onPress={openMediaManager}
                            />
                            {mediaPreviewItems.length ? (
                                <TouchableOpacity
                                    onPress={openMediaManager}
                                    activeOpacity={0.82}
                                    style={{
                                        flexDirection: 'row',
                                        gap: 6,
                                        paddingHorizontal: 16,
                                        paddingTop: 8,
                                    }}
                                >
                                    {mediaPreviewItems.map((item) => {
                                        const isImage =
                                            item.fileCategory === 'image' ||
                                            item.mimeType?.startsWith(
                                                'image/',
                                            ) ||
                                            item.messageType?.toLowerCase() ===
                                                'image';
                                        const isVideo =
                                            item.fileCategory === 'video' ||
                                            item.mimeType?.startsWith(
                                                'video/',
                                            ) ||
                                            item.messageType?.toLowerCase() ===
                                                'video';

                                        return (
                                            <View
                                                key={
                                                    item.messageId ||
                                                    item._id ||
                                                    item.mediaUrl
                                                }
                                                style={{
                                                    width: 76,
                                                    height: 60,
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    backgroundColor:
                                                        colors.backgroundSecondary,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {isImage || isVideo ? (
                                                    <Image
                                                        source={{
                                                            uri: toAbsoluteUrl(
                                                                item.mediaUrl,
                                                            ),
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                        }}
                                                    />
                                                ) : (
                                                    <MaterialCommunityIcons
                                                        name="file-outline"
                                                        size={26}
                                                        color={
                                                            colors.textSecondary
                                                        }
                                                    />
                                                )}
                                                {isVideo ? (
                                                    <View
                                                        style={{
                                                            position:
                                                                'absolute',
                                                            top: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            left: 0,
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                            backgroundColor:
                                                                'rgba(0,0,0,0.22)',
                                                        }}
                                                    >
                                                        <MaterialCommunityIcons
                                                            name="play-circle"
                                                            size={26}
                                                            color="#fff"
                                                        />
                                                    </View>
                                                ) : null}
                                            </View>
                                        );
                                    })}
                                    <View
                                        style={{
                                            width: 76,
                                            height: 60,
                                            borderRadius: 8,
                                            backgroundColor:
                                                colors.backgroundSecondary,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons
                                            name="arrow-forward"
                                            size={25}
                                            color={LOGIN_PRIMARY}
                                        />
                                    </View>
                                </TouchableOpacity>
                            ) : null}
                        </Section>

                        <Section
                            title={groupMode ? 'Group bulletin board' : 'Bulletin board'}
                        >
                            <InfoRow
                                icon="alarm-check"
                                title="Reminders list"
                            />
                            <InfoRow
                                icon="notebook-outline"
                                title="Notes, pins, polls"
                            />
                        </Section>

                        <Section title="Security settings">
                            <InfoRow
                                icon="pin-outline"
                                title="Pinned messages"
                                subtitle={
                                    pinnedMessages.length
                                        ? `${pinnedMessages.length} messages`
                                        : 'No pinned messages'
                                }
                                showChevron
                                onPress={() => setPinnedMessagesVisible(true)}
                            />
                        </Section>

                        <Section title="Security settings">
                            <InfoRow
                                icon="timer-outline"
                                title="Auto-delete messages"
                                subtitle={getAutoDeleteLabel(
                                    autoDeleteDuration,
                                    groupMode,
                                )}
                                showChevron
                                onPress={handleAutoDelete}
                            />
                            <InfoRow
                                icon="eye-off-outline"
                                title={
                                    isHidden
                                        ? 'Unhide chat'
                                        : 'Hide chat'
                                }
                                showChevron
                                onPress={() => {
                                    setPasswordMode(
                                        isHidden ? 'reveal' : 'hide',
                                    );
                                    setPassword('');
                                }}
                            />
                        </Section>

                        <Section>
                            <DangerRow
                                icon="alert-box-outline"
                                title="Report"
                                muted
                            />
                            <DangerRow
                                icon="delete-outline"
                                title="Clear chat history"
                                onPress={handleClearHistory}
                            />
                            {groupMode ? (
                                <>
                                    <DangerRow
                                        icon="logout"
                                        title="Leave group"
                                        onPress={handleLeaveGroup}
                                    />
                                    {isOwner ? (
                                        <DangerRow
                                            icon="trash-can-outline"
                                            title="Disband group"
                                            onPress={handleDissolveGroup}
                                        />
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <DangerRow
                                        icon="delete-outline"
                                        title="Delete conversation"
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
                                                ? 'Unblock user'
                                                : 'Block user'
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
                <TransferOwnerDialog
                    visible={transferOwnerVisible}
                    members={ownerTransferCandidates}
                    selectedUserId={selectedTransferOwnerId}
                    onSelect={setSelectedTransferOwnerId}
                    onCancel={() => {
                        setTransferOwnerVisible(false);
                        setSelectedTransferOwnerId('');
                    }}
                    onSubmit={handleConfirmLeaveGroupWithTransfer}
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
                    onDataChanged={refreshData}
                />
                <GroupMembersModal
                    visible={membersVisible}
                    members={groupMembers}
                    canManage={canManageGroup}
                    onClose={() => setMembersVisible(false)}
                    onMemberPress={handleMemberAction}
                />
                <PinnedMessagesModal
                    visible={pinnedMessagesVisible}
                    messages={pinnedMessages}
                    onClose={() => setPinnedMessagesVisible(false)}
                    onUnpin={handleUnpinMessage}
                />
                <AddMembersModal
                    visible={addMembersVisible}
                    conversationId={conversationId}
                    existingMemberIds={groupMembers.map((m) => m.userId)}
                    onClose={() => setAddMembersVisible(false)}
                    onAdded={() => {
                        setAddMembersVisible(false);
                        void refreshData();
                    }}
                />
            </Animated.View>
        </Modal>
    );
}

function GroupMembersModal({
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
    const [searchText, setSearchText] = useState('');

    const sortedMembers = useMemo(() => {
        const normalized = searchText.trim().toLowerCase();
        const roleOrder = { admin: 0, 'co-admin': 1, member: 2 };

        return members
            .filter((member) => {
                if (!normalized) return true;
                return (member.fullName || member.userId)
                    .toLowerCase()
                    .includes(normalized);
            })
            .sort((left, right) => {
                const roleDiff =
                    (roleOrder[left.role] ?? 3) - (roleOrder[right.role] ?? 3);
                if (roleDiff !== 0) return roleDiff;
                return (left.fullName || left.userId).localeCompare(
                    right.fullName || right.userId,
                    'vi',
                    { sensitivity: 'base' },
                );
            });
    }, [members, searchText]);

    useEffect(() => {
        if (!visible) setSearchText('');
    }, [visible]);

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
                    paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24),
                    paddingBottom: insets.bottom,
                }}
            >
                <HeaderBar title={`Members (${members.length})`} onBack={onClose} />
                <View style={{ padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.divider }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            minHeight: 42,
                        }}
                    >
                        <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
                        <TextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search members"
                            placeholderTextColor={colors.textSecondary}
                            style={{ flex: 1, color: colors.text, fontSize: 15 }}
                        />
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {sortedMembers.length ? (
                        sortedMembers.map((member) => (
                            <MemberManagementRow
                                key={member.userId}
                                member={member}
                                canManage={canManage}
                                onPress={() => onMemberPress(member)}
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
                            No members found
                        </Text>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

function PinnedMessagesModal({
    visible,
    messages,
    onClose,
    onUnpin,
}: {
    visible: boolean;
    messages: PinnedMessageItem[];
    onClose: () => void;
    onUnpin: (messageId: string) => void;
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
                    paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24),
                    paddingBottom: insets.bottom,
                }}
            >
                <HeaderBar title="Pinned messages" onBack={onClose} />
                <ScrollView showsVerticalScrollIndicator={false}>
                    {messages.length ? (
                        messages.map((message) => (
                            <PinnedMessageRow
                                key={message.messageId}
                                message={message}
                                onUnpin={() => onUnpin(message.messageId)}
                            />
                        ))
                    ) : (
                        <Text
                            style={{
                                color: colors.textSecondary,
                                textAlign: 'center',
                                paddingVertical: 32,
                            }}
                        >
                            No pinned messages
                        </Text>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

function PinnedMessageRow({
    message,
    onUnpin,
}: {
    message: PinnedMessageItem;
    onUnpin: () => void;
}) {
    const { colors } = useTheme();
    const content =
        message.content ||
        message.attachment?.fileName ||
        (message.messageType ? `${message.messageType} Message` : 'Message');

    return (
        <View
            style={{
                minHeight: 76,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.divider,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
            }}
        >
            <MaterialCommunityIcons name="pin" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
                <Text
                    style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}
                    numberOfLines={2}
                >
                    {content}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                    {formatPinnedDate(
                        String(message.pinnedAt || message.createdAt || ''),
                    )}
                </Text>
            </View>
            <TouchableOpacity onPress={onUnpin} hitSlop={8}>
                <MaterialCommunityIcons name="pin-off-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
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
                            ? 'Enter password to unhide'
                            : 'Set password to hide conversation'}
                    </Text>
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        secureTextEntry
                        placeholder="Password"
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
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSubmit}>
                            <Text
                                style={{
                                    color: LOGIN_PRIMARY,
                                    fontWeight: '800',
                                }}
                            >
                                Confirm
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
                        Change group name
                    </Text>
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder="Group name"
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
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSubmit}>
                            <Text
                                style={{
                                    color: LOGIN_PRIMARY,
                                    fontWeight: '800',
                                }}
                            >
                                Save
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function TransferOwnerDialog({
    visible,
    members,
    selectedUserId,
    onSelect,
    onCancel,
    onSubmit,
}: {
    visible: boolean;
    members: GroupMemberItem[];
    selectedUserId: string;
    onSelect: (userId: string) => void;
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
                        maxHeight: '78%',
                        borderRadius: 12,
                        backgroundColor: colors.background,
                        overflow: 'hidden',
                    }}
                >
                    <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 17,
                                fontWeight: '800',
                            }}
                        >
                            Select new leader
                        </Text>
                        <Text
                            style={{
                                color: colors.textSecondary,
                                fontSize: 13,
                                marginTop: 6,
                                lineHeight: 19,
                             }}
                         >
                            You are the leader. Please select another member
                            as the new leader before leaving.
                        </Text>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ marginTop: 10 }}
                    >
                        {members.map((member) => {
                            const selected = selectedUserId === member.userId;
                            return (
                                <TouchableOpacity
                                    key={member.userId}
                                    onPress={() => onSelect(member.userId)}
                                    activeOpacity={0.75}
                                    style={{
                                        minHeight: 64,
                                        paddingHorizontal: 18,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                        borderTopWidth: 0.5,
                                        borderTopColor: colors.divider,
                                    }}
                                >
                                    {member.avatarUrl ? (
                                        <Image
                                            source={{
                                                uri: toAbsoluteUrl(
                                                    member.avatarUrl,
                                                ),
                                            }}
                                            style={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: 21,
                                            }}
                                        />
                                    ) : (
                                        <View
                                            style={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: 21,
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
                                                fontSize: 15,
                                                fontWeight: '700',
                                            }}
                                            numberOfLines={1}
                                        >
                                            {member.fullName || 'Member'}
                                        </Text>
                                        <Text
                                            style={{
                                                color: colors.textSecondary,
                                                fontSize: 12,
                                                marginTop: 2,
                                            }}
                                        >
                                            {getRoleLabel(member.role)}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons
                                        name={
                                            selected
                                                ? 'radiobox-marked'
                                                : 'radiobox-blank'
                                        }
                                        size={24}
                                        color={
                                            selected
                                                ? LOGIN_PRIMARY
                                                : colors.textSecondary
                                        }
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            gap: 16,
                            padding: 18,
                            borderTopWidth: 0.5,
                            borderTopColor: colors.divider,
                        }}
                    >
                        <TouchableOpacity onPress={onCancel}>
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontWeight: '700',
                                }}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSubmit}>
                            <Text
                                style={{
                                    color: LOGIN_PRIMARY,
                                    fontWeight: '800',
                                }}
                            >
                                Continue
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function AddMembersModal({
    visible,
    conversationId,
    existingMemberIds,
    onClose,
    onAdded,
}: {
    visible: boolean;
    conversationId: string;
    existingMemberIds: string[];
    onClose: () => void;
    onAdded: () => void;
}) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [friends, setFriends] = useState<FriendResponse[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadFriends = async () => {
        try {
            setLoading(true);
            setError(null);

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
                setError('Cannot identify userId');
                return;
            }

            const response = await friendApi.getFriends(userId);
            setFriends(response || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load friends list',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            void loadFriends();
            setSelectedFriends([]);
            setSearchText('');
            setError(null);
        }
    }, [visible]);

    const filteredFriends = useMemo(() => {
        // Only show friends who are NOT in the group
        const notInGroup = friends.filter(
            (friend) => !existingMemberIds.includes(friend.id),
        );

        if (!searchText.trim()) return notInGroup;
        const normalizedSearch = searchText.toLowerCase().trim();
        return notInGroup.filter((friend) =>
            friend.fullName.toLowerCase().includes(normalizedSearch),
        );
    }, [friends, existingMemberIds, searchText]);

    const handleToggleFriend = (friendId: string) => {
        setSelectedFriends((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId],
        );
    };

    const handleAddMembers = async () => {
        if (selectedFriends.length === 0) return;

        try {
            setAdding(true);
            setError(null);
            await chatApi.addGroupMembers(conversationId, selectedFriends);
            Alert.alert('Success', 'Added members to the group');
            onAdded();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to add members',
            );
        } finally {
            setAdding(false);
        }
    };

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
                {/* Header */}
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingTop: 12,
                        paddingBottom: 12,
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
                        Add members
                    </Text>
                    <TouchableOpacity onPress={onClose} disabled={adding}>
                        <MaterialCommunityIcons
                            name="close"
                            size={24}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1, padding: 16 }}>
                    {/* Search Input */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: Platform.OS === 'ios' ? 10 : 6,
                            marginBottom: 16,
                        }}
                    >
                        <Ionicons
                            name="search-outline"
                            size={20}
                            color={colors.textSecondary}
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            placeholder="Search friends"
                            placeholderTextColor={colors.textSecondary}
                            value={searchText}
                            onChangeText={setSearchText}
                            style={{
                                flex: 1,
                                color: colors.text,
                                fontSize: 15,
                            }}
                        />
                    </View>

                    {loading ? (
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <ActivityIndicator
                                size="large"
                                color={LOGIN_PRIMARY}
                            />
                        </View>
                    ) : filteredFriends.length === 0 ? (
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    textAlign: 'center',
                                }}
                            >
                                {friends.length === 0
                                    ? 'No friends found.'
                                    : 'All friends have joined this group.'}
                            </Text>
                        </View>
                    ) : (
                        <ScrollView style={{ flex: 1 }}>
                            {filteredFriends.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleToggleFriend(item.id)}
                                    activeOpacity={0.7}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        borderBottomWidth: 0.5,
                                        borderBottomColor: colors.divider,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 20,
                                            backgroundColor:
                                                colors.backgroundSecondary,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 12,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {item.avatarUrl ? (
                                            <Image
                                                source={{
                                                    uri: toAbsoluteUrl(
                                                        item.avatarUrl,
                                                    ),
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
                                            fontSize: 15,
                                            fontWeight: '500',
                                        }}
                                    >
                                        {item.fullName}
                                    </Text>

                                    <MaterialCommunityIcons
                                        name={
                                            selectedFriends.includes(item.id)
                                                ? 'checkbox-marked'
                                                : 'checkbox-blank-outline'
                                        }
                                        size={24}
                                        color={
                                            selectedFriends.includes(item.id)
                                                ? LOGIN_PRIMARY
                                                : colors.textSecondary
                                        }
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Selected Count */}
                    {selectedFriends.length > 0 && (
                        <Text
                            style={{
                                marginTop: 12,
                                fontSize: 13,
                                fontWeight: '500',
                                color: colors.textSecondary,
                            }}
                        >
                            Selected {selectedFriends.length} members
                        </Text>
                    )}

                    {/* Error Message */}
                    {error && (
                        <View
                            style={{
                                backgroundColor: '#fee2e2',
                                borderRadius: 8,
                                padding: 12,
                                marginTop: 12,
                            }}
                        >
                            <Text style={{ color: '#dc2626', fontSize: 14 }}>
                                {error}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Footer Buttons */}
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
                        onPress={onClose}
                        disabled={adding}
                        style={{
                            flex: 1,
                            paddingVertical: 12,
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
                            Cancel
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleAddMembers}
                        disabled={adding || selectedFriends.length === 0}
                        style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 8,
                            backgroundColor: LOGIN_PRIMARY,
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: selectedFriends.length === 0 ? 0.6 : 1,
                        }}
                    >
                        <Text
                            style={{
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: '600',
                            }}
                        >
                            Add
                        </Text>
                    </TouchableOpacity>
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
    onDataChanged,
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
    onDataChanged: () => void;
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
            void chatApi
                .updateGroupJoinApproval(conversationId, nextValue)
                .catch(() => {
                    setSettings((prev) => ({ ...prev, [key]: !nextValue }));
                    Alert.alert('Unable to update', 'Please try again later.');
                });
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
                'Unable to load join requests',
                error instanceof Error
                    ? error.message
                    : 'Please try again later.',
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
                if (approved) {
                    onDataChanged();
                }
                Alert.alert(
                    'Success',
                    approved
                        ? 'Join request approved.'
                        : 'Join request rejected.',
                );
            })
            .catch((error) => {
                Alert.alert(
                    'Unable to perform action',
                    error instanceof Error
                        ? error.message
                        : 'Please try again later.',
                );
            });
    };

    const shareGroupLink = () => {
        void Share.share({ message: groupLink }).catch(() => undefined);
    };

    const refreshGroupLink = () => {
        Alert.alert(
            'Refreshing link not supported yet',
            'The backend does not support link regeneration yet.',
        );
    };

    const renderShell = (children: React.ReactNode, title = 'Group Management') => (
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
                        Platform.OS === 'ios' ? 44 : 24,
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
                    No join requests
                    </Text>
                )}
            </ScrollView>,
            'Join Requests',
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
            'Leaders & Deputies',
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
                    Allow group members to:
                </Text>
                <PermissionRow
                    title="Change group name & avatar"
                    checked={permissions.changeNameAvatar}
                    onPress={() => togglePermission('changeNameAvatar')}
                />
                <PermissionRow
                    title="Pin messages, notes, polls to the top of conversation"
                    checked={permissions.pinMessages}
                    onPress={() => togglePermission('pinMessages')}
                />
                <PermissionRow
                    title="Create new notes, reminders"
                    checked={permissions.createNotes}
                    onPress={() => togglePermission('createNotes')}
                />
                <PermissionRow
                    title="Create new polls"
                    checked={permissions.createPolls}
                    onPress={() => togglePermission('createPolls')}
                />
                <PermissionRow
                    title="Send messages"
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
                    title="Approve new members mode"
                    value={settings.approveNewMembers}
                    onValueChange={() => toggleSetting('approveNewMembers')}
                    disabled={!canManage}
                />
                <SettingSwitchRow
                    title="Highlight leader/deputy messages"
                    value={settings.markLeaderMessages}
                    onValueChange={() => toggleSetting('markLeaderMessages')}
                />
                <SettingSwitchRow
                    title="Allow new members to read recent messages"
                    value={settings.allowReadRecentMessages}
                    onValueChange={() =>
                        toggleSetting('allowReadRecentMessages')
                    }
                />
                <SettingSwitchRow
                    title="Allow joining via link"
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
                    title="Blocked from group"
                />
                <ManagementMenuRow
                    icon="key-outline"
                    title={`Leaders & Deputies (${members.length}/${memberLimit})`}
                    onPress={() => setShowMembers(true)}
                />
                {canManage && settings.approveNewMembers ? (
                    <ManagementMenuRow
                        icon="account-clock-outline"
                        title="Join Requests"
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
                    Disband group
                </Text>
            </TouchableOpacity>
        </ScrollView>,
    );
}

function HeaderBar({ title, onBack }: { title: string; onBack: () => void }) {
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
                position: 'relative',
            }}
        >
            <TouchableOpacity onPress={onBack} hitSlop={8} style={{ zIndex: 10 }}>
                <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>
            <View
                style={{
                    position: 'absolute',
                    left: 40,
                    right: 40,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 17,
                        fontWeight: '700',
                        textAlign: 'center',
                    }}
                    numberOfLines={1}
                >
                    {title}
                </Text>
            </View>
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
    const LOGIN_PRIMARY = colors.primary;
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
    const LOGIN_PRIMARY = colors.primary;
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
    const LOGIN_PRIMARY = colors.primary;
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
                    {member.fullName || 'Member'}
                    {member.isMe ? ' (You)' : ''}
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
    const LOGIN_PRIMARY = colors.primary;
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
                    {request.requester.fullName || 'User'}
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
                    paddingTop: Math.max(
                        insets.top,
                        Platform.OS === 'ios' ? 44 : 24,
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
                        Group Management
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
                            ? 'Tap on a member to manage roles or remove them from the group.'
                            : 'You do not have permission to manage group members.'}
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
                                    {member.fullName || 'Member'}
                                    {member.isMe ? ' (You)' : ''}
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
    const LOGIN_PRIMARY = colors.primary;
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
                <Text style={{ color: colors.text, fontSize: 15 }}>
                    {title}
                </Text>
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
