import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import MessageTimestamp from "@/components/chat/MessageTimestamp";
import { formatTime, getDiffMinutes, useChat } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { Message } from "@/types/chat";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const router = useRouter();
  const { id, name, avatarUri } = params;
  const { colors, colorScheme } = useTheme();
  const { messages, inputText, setInputText, sendMessage, sendAttachment } = useChat(id || "");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) {
      console.error("[ChatScreen] Missing required parameter: id");
      Alert.alert("Error", "Invalid chat ID. Going back...");
      setTimeout(() => router.back(), 500);
    }
  }, [id, router]);

  const handleSend = useCallback(() => {
    sendMessage(inputText);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [inputText, sendMessage]);

  const lastMessage = messages[0];

  function shouldShowTimestamp(messages: Message[], index: number): boolean {
    if (index === 0) return true;

    const prev = messages[index - 1];
    const curr = messages[index];

    const diffMinutes = getDiffMinutes(prev.timestamp, curr.timestamp);

    return diffMinutes > 30 || index === messages.length - 1;
  }

  console.log("LAST MSG ", messages[messages.length - 1]);

  const lastMessageTimeAgo = lastMessage
    ? getDiffMinutes(lastMessage.timestamp, new Date().toISOString())
    : "";

  console.log("LAST MSG TIME AGO ", lastMessageTimeAgo);

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <View>
        {shouldShowTimestamp(messages, index) && (
          <MessageTimestamp time={formatTime(item.timestamp)} />
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
      edges={["top"]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <ChatHeader name={name ?? "Chat"} avatarUri={avatarUri} isOnline />

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            listRef.current?.scrollToOffset({ offset: 0, animated: false })
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
