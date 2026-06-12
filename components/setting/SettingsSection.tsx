import React from "react";
import { Text, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  noTopMargin?: boolean;
}

export default function SettingsSection({
  title,
  children,
  noTopMargin = false,
}: SettingsSectionProps) {
  const colors = useThemeColors();

  return (
    <View className={`px-4 ${noTopMargin ? "mt-0" : "mt-6"}`}>
      <Text
        className="text-[16px] font-semibold uppercase tracking-wider"
        style={{ color: colors.textSecondary }}
      >
        {title}
      </Text>
      <View className="mt-3 rounded-2xl">{children}</View>
    </View>
  );
}
