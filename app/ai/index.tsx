import { AIActionBar } from "@/components/ai/AIActionBar";
import { AIHeader } from "@/components/ai/AIHeader";
import { AIInput } from "@/components/ai/AIInput";
import { AIMessageBubble } from "@/components/ai/AIMessageBubble";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { createConversation, sendMessage } from "@/store/slices/aiSlice";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AIScreen() {
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);

  const { currentConversation, isLoading } = useAppSelector(
    (state) => state.ai,
  );

  useEffect(() => {
    // Create initial conversation if none exists
    if (!currentConversation) {
      dispatch(createConversation({ type: "chat" }));
    }
  }, [currentConversation, dispatch]);

  const handleSendMessage = async (message: string) => {
    if (!currentConversation) return;

    try {
      await dispatch(
        sendMessage({
          message,
          conversationId: currentConversation.id,
        }),
      ).unwrap();

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleActionPress = (actionId: string) => {
    console.log("Action pressed:", actionId);
    // TODO: Implement action handlers (summarize, write, translate, etc.)
  };

  const messages = currentConversation?.messages || [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <AIHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        keyboardVerticalOffset={0}
        contentContainerStyle={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AIMessageBubble message={item} />}
            style={{ flex: 1, backgroundColor: "#FFFFFF" }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 16,
              flexGrow: 1,
            }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-gray-500 text-center">
                  Hello! I&apos;m your AI assistant.{"\n"}
                  How can I help you today?
                </Text>
              </View>
            }
          />

          {/* Loading Indicator */}
          {isLoading && (
            <View className="px-4 py-2 bg-white">
              <ActivityIndicator size="small" color="#00B48D" />
            </View>
          )}
        </View>

        {/* Action Bar */}
        <AIActionBar onActionPress={handleActionPress} />

        {/* Input */}
        <AIInput onSend={handleSendMessage} disabled={isLoading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
