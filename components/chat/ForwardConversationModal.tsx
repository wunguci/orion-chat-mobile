import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { chatApi, ConversationResponse } from '@/services/api/chat';
import ChatAvatar from './ChatAvatar';

/**
 * Thành phần Modal chuyển tiếp tin nhắn
 *
 * Luồng hoạt động:
 * 1. Người dùng chọn "Chuyển tiếp" trên tin nhắn
 * 2. Modal hiển thị danh sách tất cả conversation của user
 * 3. Người dùng chọn conversation đích
 * 4. Gọi API forwardMessage với ID tin nhắn gốc + conversation đích
 * 5. Server tạo copy tin nhắn trong conversation mới
 * 6. Quay lại chat list
 */
interface ForwardConversationModalProps {
    visible: boolean;
    onClose: () => void;
    onForward: (conversationId: string) => Promise<void>;
    sourceMessageId: string;
    currentConversationId: string;
}

export default function ForwardConversationModal({
    visible,
    onClose,
    onForward,
    sourceMessageId,
    currentConversationId,
}: ForwardConversationModalProps) {
    const { colors } = useTheme();
    const { state: authState } = useAuth();
    const [conversations, setConversations] = useState<ConversationResponse[]>(
        [],
    );
    const [loading, setLoading] = useState(false);
    const [selectedConversationIds, setSelectedConversationIds] = useState<
        Set<string>
    >(new Set());
    const [forwarding, setForwarding] = useState(false);

    /**
     * Load danh sách conversation khi modal mở
     */
    useEffect(() => {
        if (!visible || !authState.user?.userId) return;

        const loadConversations = async () => {
            try {
                setLoading(true);
                const data = await chatApi.getConversations(
                    authState.user!.userId,
                    100,
                    0,
                );
                // Lọc ra conversation khác (không bao gồm conversation hiện tại)
                const filtered = data.filter(
                    (c) => c.conversationId !== currentConversationId,
                );
                setConversations(filtered);
            } catch (error) {
                console.error(
                    'Error loading conversations for forward:',
                    error,
                );
                Alert.alert('Error', 'Unable to load conversations');
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, [visible, authState.user?.userId, currentConversationId]);

    /**
     * Xử lý chuyển tiếp tin nhắn đến nhiều conversation
     */
    const handleForwardMessage = async () => {
        if (selectedConversationIds.size === 0) {
            Alert.alert(
                'Notification',
                'Please select at least one conversation',
            );
            return;
        }

        try {
            setForwarding(true);
            const conversationIds = Array.from(selectedConversationIds);
            for (const conversationId of conversationIds) {
                await onForward(conversationId);
            }
            Alert.alert(
                'Success',
                `Message has been forwarded to ${selectedConversationIds.size} conversations`,
            );
            onClose();
            setSelectedConversationIds(new Set());
        } catch (error) {
            console.error('Error forwarding message:', error);
            Alert.alert(
                'Error',
                error instanceof Error
                    ? error.message
                    : 'Unable to forward message',
            );
        } finally {
            setForwarding(false);
        }
    };

    /**
     * Render item trong danh sách conversation
     */
    const renderConversationItem = ({
        item,
    }: {
        item: ConversationResponse;
    }) => {
        const isGroup = item.type === 'GROUP';
        const otherParticipant = !isGroup
            ? item.participants.find(
                  (p: any) => p.userId !== item.participants[0]?.userId,
              )
            : null;
        const displayName = isGroup
            ? item.groupInfo?.groupName || 'Group'
            : otherParticipant?.fullName || 'Unknown';

        const isSelected = selectedConversationIds.has(item.conversationId);

        const toggleSelection = () => {
            const newSet = new Set(selectedConversationIds);
            if (newSet.has(item.conversationId)) {
                newSet.delete(item.conversationId);
            } else {
                newSet.add(item.conversationId);
            }
            setSelectedConversationIds(newSet);
        };

        return (
            <TouchableOpacity
                onPress={toggleSelection}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: isSelected
                        ? colors.primary + '20'
                        : colors.background,
                    borderLeftWidth: isSelected ? 4 : 0,
                    borderLeftColor: isSelected
                        ? colors.primary
                        : 'transparent',
                }}
            >
                {/* Avatar */}
                <View
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.primary + '30',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}
                >
                    <Text style={{ fontSize: 24 }}>
                        {displayName.charAt(0).toUpperCase()}
                    </Text>
                </View>

                {/* Tên và loại */}
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.text,
                            marginBottom: 4,
                        }}
                    >
                        {displayName}
                    </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                        }}
                    >
                        {isGroup
                            ? `${item.participants.length} members`
                            : 'Direct Chat'}
                    </Text>
                </View>

                {/* Checkbox đơn giản */}
                {isSelected && (
                    <View
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: 8,
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 16 }}>✓</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    paddingTop: 50,
                }}
            >
                {/* Header */}
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        backgroundColor: colors.background,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '700',
                                color: colors.text,
                            }}
                        >
                            Forward to
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text
                                style={{
                                    fontSize: 16,
                                    color: colors.primary,
                                    fontWeight: '600',
                                }}
                            >
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{
                            fontSize: 13,
                            color: colors.textSecondary,
                        }}
                    >
                        Select conversations to forward the message
                    </Text>
                </View>

                {/* Danh sách conversation */}
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
                            color={colors.primary}
                        />
                    </View>
                ) : conversations.length === 0 ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                color: colors.textSecondary,
                            }}
                        >
                            No conversations found
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        renderItem={renderConversationItem}
                        keyExtractor={(item) => item.conversationId}
                        ItemSeparatorComponent={() => (
                            <View
                                style={{
                                    height: 0.5,
                                    marginLeft: 76,
                                    backgroundColor: colors.divider,
                                }}
                            />
                        )}
                    />
                )}

                {/* Footer với nút "Chuyển tiếp" */}
                {!loading && conversations.length > 0 && (
                    <View
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                            backgroundColor: colors.background,
                        }}
                    >
                        <TouchableOpacity
                            onPress={handleForwardMessage}
                            disabled={
                                selectedConversationIds.size === 0 || forwarding
                            }
                            style={{
                                backgroundColor:
                                    selectedConversationIds.size > 0 &&
                                    !forwarding
                                        ? colors.primary
                                        : colors.primary + '50',
                                paddingVertical: 14,
                                borderRadius: 8,
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexDirection: 'row',
                            }}
                        >
                            {forwarding ? (
                                <ActivityIndicator
                                    color="white"
                                    style={{ marginRight: 8 }}
                                />
                            ) : null}
                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}
                            >
                                {forwarding
                                    ? 'Forwarding...'
                                    : 'Forward'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}
