import { Avatar } from "@/components/common/Avatar";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FriendRequestItem } from "@/types/friend";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  request: FriendRequestItem;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const FriendRequestRow: React.FC<Props> = ({
  request,
  onAccept,
  onDecline,
}) => {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <Avatar uri={request.avatar} name={request.name} size="lg" />
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-gray-primary">
          {request.name}
        </Text>
        <Text className="text-sm text-gray-text mt-0.5">{request.timeAgo}</Text>
        <View className="flex-row mt-3 gap-2">
          <TouchableOpacity
            onPress={() => onAccept(request.id)}
            className="flex-1 py-2.5 rounded-lg items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDecline(request.id)}
            className="flex-1 py-2.5 rounded-lg items-center"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Text className="font-semibold" style={{ color: colors.primary }}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
