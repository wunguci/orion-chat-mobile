import { Avatar } from "@/components/common/Avatar";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { SearchUserItem } from "@/types/friend";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  user: SearchUserItem;
  onAdd: (userId: string) => void;
  onMessage?: (userId: string) => void;
  isPending?: boolean;
}

export const SearchUserRow: React.FC<Props> = ({
  user,
  onAdd,
  onMessage,
  isPending = false,
}) => {
  const colors = useThemeColors();

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
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => onMessage?.(user.id)}
          className="bg-white border border-gray-200 px-3 py-2 rounded-lg mr-2"
        >
          <Text className="text-gray-primary font-semibold">Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isPending}
          onPress={() => onAdd(user.id)}
          className="px-4 py-2 rounded-lg disabled:opacity-70"
          style={{ backgroundColor: colors.primaryLight }}
        >
          <Text className="font-semibold" style={{ color: colors.primary }}>
            {isPending ? "Request sent" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
