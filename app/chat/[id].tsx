import ChatHeader from '@/components/chat/ChatHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import MessageTimestamp from '@/components/chat/MessageTimestamp';
import MessageActionMenu from '@/components/chat/MessageActionMenu';
import { formatTime, getDiffMinutes, useChat } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';
import { Message } from '@/types/chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    View,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ForwardConversationModal from '@/components/chat/ForwardConversationModal';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { chatApi } from '@/services/api/chat';
import { useNotificationContext } from '@/context/NotificationContext';
import { useFocusEffect } from 'expo-router';
import { CallContext } from '@/context/CallContext';
import { GroupCallContext } from '@/context/GroupCallContext';

function shouldShowAvatar(messages: Message[], index: number): boolean {
    const curr = messages[index];

    // Don't show avatar for sent messages
    if (curr.isMine) return false;

    // Get previous message to check if sender changed
    const prev = messages[index - 1];

    // Show avatar if:
    // 1. This is the first received message, OR
    // 2. Previous message was sent by different person OR sent by current user
    if (!prev) return true; // First message
    if (prev.isMine) return true; // Previous was sent by user
    if (curr.senderId !== prev.senderId) return true; // Sender changed

    return false; // Sender same as previous, hide avatar
}

function shouldShowSenderName(messages: Message[], index: number): boolean {
    const curr = messages[index];
    if (curr.isMine) return false;

    const prev = messages[index - 1];
    if (!prev) return true;
    if (prev.isMine) return true;

    return curr.senderId !== prev.senderId;
}

export default function ChatScreen() {
    const params = useLocalSearchParams<{
        id: string;
        name: string;
        avatarUri?: string;
        otherUserId?: string;
        isGroup?: string;
        participantIds?: string;
    }>();

    const router = useRouter();
    const { id, name, avatarUri } = params;
    const isGroup = params.isGroup === 'true';
    const participantIds = (params.participantIds || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    const { colors, colorScheme } = useTheme();
    const callContext = useContext(CallContext);
    const groupCallContext = useContext(GroupCallContext);
    const { markConversationNotificationsAsRead } = useNotificationContext();
    const { messages, inputText, setInputText, sendMessage, sendAttachment } =
        useChat(id || '');
    const listRef = useRef<FlatList>(null);

    const [forwardVisible, setForwardVisible] = useState(false);
    const [forwardMessageId, setForwardMessageId] = useState<string | null>(
        null,
    );

    // Message action menu state
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(
        null,
    );
    const [showActionMenu, setShowActionMenu] = useState(false);

    useEffect(() => {
        if (!id) {
            console.error('[ChatScreen] Missing required parameter: id');
            Alert.alert('Error', 'Invalid chat ID. Going back...');
            setTimeout(() => router.back(), 500);
        }
    }, [id, router]);

    useFocusEffect(
        useCallback(() => {
            if (!id) return;

            void markConversationNotificationsAsRead(id);
        }, [id, markConversationNotificationsAsRead]),
    );

    const handleSend = useCallback(() => {
        sendMessage(inputText);
        setTimeout(
            () => listRef.current?.scrollToEnd({ animated: false }),
            100,
        );
    }, [inputText, sendMessage]);

    const handleMessageLongPress = useCallback((message: Message) => {
        setSelectedMessage(message);
        setShowActionMenu(true);
    }, []);

    const handleMessageDeleted = useCallback(() => {
        // Remove message from list
        // The useChat hook should handle this via socket event
    }, []);

    const handleMessageRecalled = useCallback(() => {
        // The useChat hook should handle this via socket event
    }, []);

    const handleForward = useCallback((messageId: string) => {
        setForwardMessageId(messageId);
        setForwardVisible(true);
    }, []);

    const handleStartCall = useCallback(
        async (callType: 'audio' | 'video') => {
            if (!id) return;

            try {
                if (isGroup) {
                    await groupCallContext?.initiateGroupCall(
                        id,
                        participantIds,
                        callType,
                    );
                    return;
                }

                if (!params.otherUserId) {
                    Alert.alert('Khong the goi', 'Thieu thong tin nguoi nhan');
                    return;
                }

                await callContext?.initiateCall(id, params.otherUserId, callType, {
                    name: name || 'Friend',
                    avatar: avatarUri,
                });
            } catch (error) {
                Alert.alert(
                    'Khong the bat dau cuoc goi',
                    error instanceof Error ? error.message : 'Vui long thu lai sau',
                );
            }
        },
        [
            avatarUri,
            callContext,
            groupCallContext,
            id,
            isGroup,
            name,
            params.otherUserId,
            participantIds,
        ],
    );

    function shouldShowTimestamp(messages: Message[], index: number): boolean {
        if (index === 0) return true;

        const prev = messages[index - 1];
        const curr = messages[index];

        const diffMinutes = getDiffMinutes(prev.timestamp, curr.timestamp);
        return diffMinutes > 30;
    }

    // const lastMessage = messages[messages.length - 1];
    // const lastMessageTimeAgo = lastMessage
    //   ? getDiffMinutes(lastMessage.timestamp, new Date().toISOString())
    //   : "";

    // console.log("LAST MSG ", messages[messages.length - 1]);

    // console.log("LAST MSG TIME AGO ", lastMessageTimeAgo);

    const renderItem = useCallback(
        ({ item, index }: { item: Message; index: number }) => (
            <View>
                {shouldShowTimestamp(messages, index) && (
                    <MessageTimestamp time={formatTime(item.timestamp)} />
                )}
                <MessageBubble
                    message={item}
                    showAvatar={shouldShowAvatar(messages, index)}
                    avatarUri={
                        !item.isMine
                            ? item.senderAvatar || avatarUri
                            : undefined
                    }
                    senderName={
                        shouldShowSenderName(messages, index)
                            ? item.senderName || name
                            : undefined
                    }
                    onLongPress={handleMessageLongPress}
                />
            </View>
        ),
        [messages, avatarUri, name, handleMessageLongPress],
    );

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: colors.background }}
            edges={['top']}
        >
            <StatusBar
                barStyle={
                    colorScheme === 'dark' ? 'light-content' : 'dark-content'
                }
                backgroundColor={colors.background}
            />

            {/* Header */}
            <ChatHeader
                name={name ?? 'Chat'}
                avatarUri={avatarUri}
                isOnline
                onAudioCall={() => void handleStartCall('audio')}
                onVideoCall={() => void handleStartCall('video')}
            />

            {/* Messages */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(m) => m.id}
                    renderItem={renderItem}
                    contentContainerStyle={{
                        paddingVertical: 12,
                    }}
                    onContentSizeChange={() =>
                        listRef.current?.scrollToEnd({ animated: false })
                    }
                    showsVerticalScrollIndicator={false}
                />

                {/* Input */}
                <MessageInput
                    value={inputText}
                    onChangeText={setInputText}
                    onSend={handleSend}
                    onAttach={sendAttachment}
                />
            </KeyboardAvoidingView>

            {/* Message Action Menu */}
            {selectedMessage && (
                <MessageActionMenu
                    visible={showActionMenu}
                    onClose={() => {
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                    }}
                    onForward={handleForward}
                    message={selectedMessage}
                    conversationId={id || ''}
                    onMessageDeleted={handleMessageDeleted}
                    onMessageRecalled={handleMessageRecalled}
                />
            )}
            {forwardMessageId && (
                <ForwardConversationModal
                    visible={forwardVisible}
                    onClose={() => {
                        setForwardVisible(false);
                        setForwardMessageId(null);
                    }}
                    sourceMessageId={forwardMessageId}
                    currentConversationId={id || ''}
                    onForward={async (targetConversationId: string) => {
                        try {
                            const clientMessageId = generateUniqueId();
                            await chatApi.forwardMessage(
                                forwardMessageId,
                                targetConversationId,
                                clientMessageId,
                            );
                        } catch (error) {
                            console.error('Forward error:', error);
                        }
                    }}
                />
            )}
        </SafeAreaView>
    );
}
