import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Avatar } from "@/components/common/Avatar";
import type { SuggestedFriendItem } from "@/types/friend";

interface Props {
  friend: SuggestedFriendItem;
  onAdd: (id: string) => void;
}

export const SuggestedFriendItem: React.FC<Props> = ({ friend, onAdd }) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      {/* Avatar + Info */}
      <View className="flex-row items-center flex-1">
        <Avatar uri={friend.avatar} name={friend.name} size="md" />
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-primary">
            {friend.name}
          </Text>
          <Text className="text-sm text-gray-text mt-0.5" numberOfLines={1}>
            {friend.mutualGroupCount} mutual groups
          </Text>
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        onPress={() => onAdd(friend.id)}
        className="bg-gray-light px-5 py-2 rounded-lg"
        activeOpacity={0.8}
      >
        <Text className="text-green-primary font-semibold">Add</Text>
      </TouchableOpacity>
    </View>
  );
};
