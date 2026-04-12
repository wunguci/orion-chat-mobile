import { useTheme } from '@/hooks/useTheme';
import { Message } from '@/types/chat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MessageActionSheetProps {
    visible: boolean;
    message: Message | null;
    onClose: () => void;
    onReply: (message: Message) => void;
    onCopy: (message: Message) => void;
    onReact: (message: Message, emoji: string) => void;
    onForward: (message: Message) => void;
    onDeleteForMe: (message: Message) => void;
    onRecall: (message: Message) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageActionSheet({
    visible,
    message,
    onClose,
    onReply,
    onCopy,
    onReact,
    onForward,
    onDeleteForMe,
    onRecall,
}: MessageActionSheetProps) {
    const { colors } = useTheme();

    const actionItems = [
        {
            key: 'reply',
            label: 'Reply',
            icon: (
                <Ionicons
                    name="arrow-undo-outline"
                    size={18}
                    color={colors.text}
                />
            ),
            onPress: () => message && onReply(message),
        },
        {
            key: 'copy',
            label: 'Copy',
            icon: (
                <Ionicons name="copy-outline" size={18} color={colors.text} />
            ),
            onPress: () => message && onCopy(message),
            hidden: !message?.text,
        },
        {
            key: 'forward',
            label: 'Forward',
            icon: (
                <Ionicons
                    name="arrow-redo-outline"
                    size={18}
                    color={colors.text}
                />
            ),
            onPress: () => message && onForward(message),
        },
        {
            key: 'delete',
            label: 'Delete for me',
            icon: (
                <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={colors.text}
                />
            ),
            onPress: () => message && onDeleteForMe(message),
        },
        {
            key: 'recall',
            label: 'Recall',
            icon: (
                <MaterialCommunityIcons
                    name="message-reply-text-outline"
                    size={18}
                    color={colors.text}
                />
            ),
            onPress: () => message && onRecall(message),
            hidden: !message?.isMine,
        },
    ];

    return (
        <Modal
            animationType="fade"
            visible={visible}
            transparent
            onRequestClose={onClose}
        >
            <Pressable
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    justifyContent: 'flex-end',
                }}
                onPress={onClose}
            >
                <Pressable
                    style={{
                        backgroundColor: colors.background,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        paddingHorizontal: 16,
                        paddingTop: 14,
                        paddingBottom: 20,
                        gap: 14,
                    }}
                    onPress={(event) => event.stopPropagation()}
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 10 }}
                    >
                        {QUICK_REACTIONS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 21,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: colors.backgroundSecondary,
                                }}
                                onPress={() => {
                                    if (!message) return;
                                    onReact(message, emoji);
                                }}
                            >
                                <Text style={{ fontSize: 20 }}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View
                        style={{
                            borderRadius: 14,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}
                    >
                        {actionItems
                            .filter((item) => !item.hidden)
                            .map((item, idx, arr) => (
                                <TouchableOpacity
                                    key={item.key}
                                    onPress={() => {
                                        item.onPress();
                                        onClose();
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 10,
                                        paddingHorizontal: 14,
                                        paddingVertical: 12,
                                        borderBottomWidth:
                                            idx === arr.length - 1 ? 0 : 1,
                                        borderBottomColor: colors.border,
                                    }}
                                >
                                    {item.icon}
                                    <Text
                                        style={{
                                            color: colors.text,
                                            fontSize: 15,
                                            fontWeight: '500',
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
