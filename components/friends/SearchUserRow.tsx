import { Avatar } from "@/components/common/Avatar";
import type { SearchUserItem } from "@/types/friend";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  user: SearchUserItem;
  onAdd: (userId: string) => void;
}

export const SearchUserRow: React.FC<Props> = ({ user, onAdd }) => {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
      <View className="flex-row items-center flex-1">
        <Avatar uri={user.avatarUrl} name={user.fullName} size="md" />
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-primary">
            {user.fullName}
          </Text>
          <Text className="text-sm text-gray-text">
            {user.phoneNumber || (user.isOnline ? "Online" : "Offline")}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onAdd(user.id)}
        className="bg-gray-light px-4 py-2 rounded-lg"
      >
        <Text className="text-green-primary font-semibold">Add</Text>
      </TouchableOpacity>
    </View>
  );
};
