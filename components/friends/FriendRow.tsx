import { Avatar } from "@/components/common/Avatar";
import { useThemeColors } from "@/hooks/useThemeColors";
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
  const colors = useThemeColors();

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
          className="text-sm"
          style={{ color: friend.isOnline ? colors.success : colors.textSecondary }}
        >
          {friend.subtext}
        </Text>
      </View>
      <View
        className="h-3 w-3 rounded-full"
        style={{
          backgroundColor: friend.isOnline
            ? colors.success
            : colors.textSecondary,
        }}
      />
      <View className="flex-row items-center ml-3">
        <TouchableOpacity
          disabled={!friend.isOnline || !onAudioCall}
          onPress={() => onAudioCall?.(friend)}
          className="h-9 w-9 rounded-full items-center justify-center mr-2"
          style={{
            backgroundColor: friend.isOnline
              ? colors.primaryLight
              : colors.backgroundSecondary,
          }}
        >
          <Ionicons
            name="call"
            size={17}
            color={friend.isOnline ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!friend.isOnline || !onVideoCall}
          onPress={() => onVideoCall?.(friend)}
          className="h-9 w-9 rounded-full items-center justify-center"
          style={{
            backgroundColor: friend.isOnline
              ? colors.primary
              : colors.backgroundSecondary,
          }}
        >
          <Ionicons
            name="videocam"
            size={18}
            color={friend.isOnline ? "#FFFFFF" : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onMorePress?.(friend)}
          className="h-9 w-9 rounded-full items-center justify-center ml-2"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
