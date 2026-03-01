import { AIMessage } from "@/types/aichat";
import { format } from "date-fns";
import React from "react";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { AIAvatar } from "./AIAvatar";

interface AIMessageBubbleProps {
  message: AIMessage;
}

export function AIMessageBubble({ message }: AIMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View className={`mb-4 ${isUser ? "items-end" : "items-start"}`}>
      <View className="flex-row items-end gap-2 max-w-[80%]">
        {/* AI Avatar (left side) */}
        {!isUser && <AIAvatar size={32} />}

        {/* Message Bubble */}
        <View>
          <View
            className={`rounded-2xl px-4 py-3 ${
              isUser ? "bg-teal-500" : "bg-gray-100"
            }`}
          >
            {isUser ? (
              <Text className="text-white text-base">{message.content}</Text>
            ) : (
              <Markdown
                style={{
                  body: {
                    color: "#000",
                    fontSize: 15,
                  },
                  code_inline: {
                    backgroundColor: "#E5E7EB",
                    color: "#000",
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderRadius: 4,
                  },
                  code_block: {
                    backgroundColor: "#E5E7EB",
                    padding: 8,
                    borderRadius: 8,
                  },
                }}
              >
                {message.content}
              </Markdown>
            )}
          </View>

          {/* Timestamp */}
          <Text className="text-xs text-gray-500 mt-1 mx-2">
            {format(new Date(message.timestamp), "HH:mm a")}
          </Text>
        </View>

        {/* User Avatar (right side) */}
        {isUser && (
          <View className="w-8 h-8 rounded-full bg-gray-400 items-center justify-center">
            <Text className="text-white text-sm font-semibold">U</Text>
          </View>
        )}
      </View>
    </View>
  );
}
