import { Avatar } from "@/components/common/Avatar";
import type { GroupItem } from "@/types/friend";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface Props {
  group: GroupItem;
}

export const GroupRow: React.FC<Props> = ({ group }) => {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <Avatar uri={group.avatar} name={group.name} size="lg" />
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-gray-primary">
          {group.name}
        </Text>
        <Text className="text-sm text-gray-text">
          {group.memberCount} members • {group.type}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </View>
  );
};
