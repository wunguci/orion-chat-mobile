import { Avatar } from "@/components/common/Avatar";
import type { FriendItem } from "@/types/friend";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  friend: FriendItem;
  onAudioCall?: (friend: FriendItem) => void;
  onVideoCall?: (friend: FriendItem) => void;
  onPress?: (friend: FriendItem) => void;
  onMorePress?: (friend: FriendItem) => void;
}

export const FriendRow: React.FC<Props> = ({
  friend,
  onAudioCall,
  onVideoCall,
  onPress,
  onMorePress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(friend)}
      className="px-4 py-3 flex-row items-center border-b border-gray-100"
    >
      <Avatar uri={friend.avatar} name={friend.name} size="lg" />
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-gray-primary">
          {friend.name}
        </Text>
        <Text
          className={`text-sm ${
            friend.isOnline ? "text-green-primary" : "text-gray-text"
          }`}
        >
          {friend.subtext}
        </Text>
      </View>
      <View
        className={`h-3 w-3 rounded-full ${
          friend.isOnline ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      <View className="flex-row items-center ml-3">
        <TouchableOpacity
          disabled={!friend.isOnline || !onAudioCall}
          onPress={() => onAudioCall?.(friend)}
          className={`h-9 w-9 rounded-full items-center justify-center mr-2 ${
            friend.isOnline ? "bg-green-50" : "bg-gray-100"
          }`}
        >
          <Ionicons
            name="call"
            size={17}
            color={friend.isOnline ? "#00B14F" : "#9CA3AF"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!friend.isOnline || !onVideoCall}
          onPress={() => onVideoCall?.(friend)}
          className={`h-9 w-9 rounded-full items-center justify-center ${
            friend.isOnline ? "bg-orange-50" : "bg-gray-100"
          }`}
        >
          <Ionicons
            name="videocam"
            size={18}
            color={friend.isOnline ? "#EE652B" : "#9CA3AF"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onMorePress?.(friend)}
          className="h-9 w-9 rounded-full items-center justify-center ml-2 bg-gray-100"
        >
          <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
