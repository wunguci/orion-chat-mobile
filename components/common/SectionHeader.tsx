import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  badge?: number;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<Props> = ({
  title,
  badge,
  actionText,
  onActionPress,
}) => {
  return (
    <View className="flex-row justify-between items-center px-4 py-3">
      <View className="flex-row items-center">
        <Text className="text-lg font-bold text-gray-primary">{title}</Text>
        {badge && badge > 0 && (
          <View className="ml-2 bg-teal-light px-2.5 py-1 rounded-full">
            <Text className="text-sm font-semibold text-green-primary">
              {badge} New
            </Text>
          </View>
        )}
      </View>

      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text className="text-sm font-semibold text-green-primary">
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
