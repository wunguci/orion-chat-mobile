import { useThemeColors } from "@/hooks/useThemeColors";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SettingsHeaderProps {
  title: string;
  showBack?: boolean;
}

export default function SettingsHeader({
  title,
  showBack = true,
}: SettingsHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View
      className="px-4 pb-4 pt-2"
      style={{
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {showBack ? (
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ChevronLeft size={24} color={colors.primary} />
            <Text
              className="ml-1 text-base font-medium"
              style={{ color: colors.primary }}
            >
              Settings
            </Text>
          </TouchableOpacity>
          <Text
            className="text-xl font-semibold"
            style={{ color: colors.text }}
          >
            {title}
          </Text>
          <View className="w-[80px]" />
        </View>
      ) : (
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          {title}
        </Text>
      )}
    </View>
  );
}
