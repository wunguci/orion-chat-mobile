import { Conversation } from "@/types/aichat";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const getIconForType = (type: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    chat: "chatbubble-ellipses",
    summarize: "document-text",
    write: "create",
    translate: "language",
    code: "code-slash",
  };
  return iconMap[type] || "chatbubble-ellipses";
};

const getColorForType = (type: string): string => {
  const colorMap: Record<string, string> = {
    chat: "#00B48D",
    summarize: "#3B82F6",
    write: "#10B981",
    translate: "#F59E0B",
    code: "#8B5CF6",
  };
  return colorMap[type] || "#00B48D";
};

export function ConversationItem({
  conversation,
  onPress,
  onArchive,
  onDelete,
}: ConversationItemProps) {
  const icon = getIconForType(conversation.type);
  const color = getColorForType(conversation.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3 bg-white"
    >
      {/* Icon */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: color + "20",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            className="text-base font-semibold text-black"
            numberOfLines={1}
          >
            {conversation.title}
          </Text>
          {conversation.status === "active" && (
            <View className="flex-row items-center gap-1 ml-2">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="text-xs text-green-500">Active</Text>
            </View>
          )}
        </View>

        <Text className="text-sm text-gray-500 mb-1" numberOfLines={2}>
          {conversation.description ||
            (conversation.messages.length > 0
              ? conversation.messages[conversation.messages.length - 1].content
              : "No messages yet")}
        </Text>

        <Text className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(conversation.updatedAt), {
            addSuffix: true,
            locale: vi,
          })}
        </Text>
      </View>

      {/* Actions (Optional) */}
      {/* Có thể thêm swipeable actions sau */}
    </TouchableOpacity>
  );
}
