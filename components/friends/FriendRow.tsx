import { Avatar } from "@/components/common/Avatar";
import type { FriendItem } from "@/types/friend";
import React from "react";
import { Text, View } from "react-native";

interface Props {
  friend: FriendItem;
}

export const FriendRow: React.FC<Props> = ({ friend }) => {
  return (
    <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
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
    </View>
  );
};
