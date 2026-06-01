import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

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
  const colors = useThemeColors();

  return (
    <View className="flex-row justify-between items-center px-4 py-3">
      <View className="flex-row items-center">
        <Text className="text-lg font-bold text-gray-primary">{title}</Text>
        {badge && badge > 0 && (
          <View style={{ backgroundColor: colors.primaryLight }} className="ml-2 px-2.5 py-1 rounded-full">
            <Text style={{ color: colors.primary }} className="text-sm font-semibold">
              {badge} New
            </Text>
          </View>
        )}
      </View>

      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={{ color: colors.primary }} className="text-sm font-semibold">
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
