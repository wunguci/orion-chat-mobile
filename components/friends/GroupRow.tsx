import { Avatar } from "@/components/common/Avatar";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { GroupItem } from "@/types/friend";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  group: GroupItem;
  onPress?: (group: GroupItem) => void;
  onAudioCall?: (group: GroupItem) => void;
  onVideoCall?: (group: GroupItem) => void;
}

export const GroupRow: React.FC<Props> = ({
  group,
  onPress,
  onAudioCall,
  onVideoCall,
}) => {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress?.(group)}
        className="flex-row items-center flex-1"
      >
        <Avatar uri={group.avatar} name={group.name} size="lg" />
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-primary">
            {group.name}
          </Text>
          <Text className="text-sm text-gray-text">
            {group.memberCount} members • {group.type}
          </Text>
        </View>
      </TouchableOpacity>

      <View className="flex-row items-center">
        {onAudioCall ? (
          <TouchableOpacity
            onPress={() => onAudioCall(group)}
            className="h-9 w-9 rounded-full border items-center justify-center mr-2"
            style={{
              backgroundColor: colors.primaryLight,
              borderColor: colors.border,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        {onVideoCall ? (
          <TouchableOpacity
            onPress={() => onVideoCall(group)}
            className="h-9 w-9 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: colors.primary }}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam" size={16} color="#fff" />
          </TouchableOpacity>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
    </View>
  );
};
