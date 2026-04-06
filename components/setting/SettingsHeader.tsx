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
    <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-2">
      {showBack ? (
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ChevronLeft size={24} color={colors.greenPrimary} />
            <Text className="ml-1 text-base font-medium text-green-primary">
              Settings
            </Text>
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-primary">
            {title}
          </Text>
          <View className="w-[80px]" />
        </View>
      ) : (
        <Text className="text-2xl font-bold text-gray-primary">{title}</Text>
      )}
    </View>
  );
}
