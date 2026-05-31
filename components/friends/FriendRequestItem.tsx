import { useThemeColors } from "@/hooks/useThemeColors";
import { FriendRequest } from "@/types/user";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "../common/Avatar";

interface Props {
  request: FriendRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const FriendRequestItem: React.FC<Props> = ({
  request,
  onAccept,
  onDecline,
}) => {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center px-4 py-3">
      {/* Avatar  */}
      <Avatar uri={request.avatar} name={request.name} size="lg" />

      {/* Info  */}
      <View className="flex-1 ml-3">
        <Text className="text-base font-semibold text-gray-primary">
          {request.name}
        </Text>
        <Text className="text-sm text-gray-text mt-0.5">
          {request.mutualFriends || `${request.mutualCount} mutual friends`}
        </Text>

        {/* buttons  */}
        <View className="flex-row mt-3 gap-2">
          <TouchableOpacity
            onPress={() => onAccept(request.id)}
            className="flex-1 py-2.5 rounded-lg items-center"
            style={{ backgroundColor: colors.primary }}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDecline(request.id)}
            className="flex-1 py-2.5 rounded-lg items-center"
            style={{ backgroundColor: colors.primaryLight }}
            activeOpacity={0.8}
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
