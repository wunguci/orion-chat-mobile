import ChatHeader from '@/components/chat/ChatHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import MessageTimestamp from '@/components/chat/MessageTimestamp';
import { useChat } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';
import { Message } from '@/types/chat';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Show timestamp between messages if gap is large or first in group
function shouldShowTimestamp(messages: Message[], index: number): boolean {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const curr = messages[index];
    return prev.timestamp !== curr.timestamp;
}

function shouldShowAvatar(messages: Message[], index: number): boolean {
    const curr = messages[index];
    if (curr.isMine) return false;
    const next = messages[index + 1];
    return !next || next.isMine;
}

export default function ChatScreen() {
    const params = useLocalSearchParams<{
        id: string;
        name: string;
        avatarUri?: string;
    }>();

    const { id, name, avatarUri } = params;
    const { colors, colorScheme } = useTheme();
    const { messages, inputText, setInputText, sendMessage } = useChat(id);
    const listRef = useRef<FlatList>(null);

    const handleSend = useCallback(() => {
        sendMessage(inputText);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, [inputText, sendMessage]);

    const renderItem = useCallback(
        ({ item, index }: { item: Message; index: number }) => (
            <View>
                {shouldShowTimestamp(messages, index) && (
                    <MessageTimestamp time={item.timestamp} />
                )}
                <MessageBubble
                    message={item}
                    showAvatar={shouldShowAvatar(messages, index)}
                    avatarUri={avatarUri}
                    senderName={name}
                />
            </View>
        ),
        [messages, avatarUri, name],
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
            <ChatHeader name={name ?? 'Chat'} avatarUri={avatarUri} isOnline />

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
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
