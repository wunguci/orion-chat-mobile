import React from "react";
import { Text, View } from "react-native";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function SettingsSection({
  title,
  children,
}: SettingsSectionProps) {
  return (
    <View className="px-4 mt-6">
      <Text className="text-[16px] font-semibold uppercase tracking-wider text-gray-secondary">
        {title}
      </Text>
      <View className="mt-3 rounded-2xl">{children}</View>
    </View>
  );
}
