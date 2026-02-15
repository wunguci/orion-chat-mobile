import { ChevronDown, ChevronRight, Play } from "lucide-react-native";
import React, { useState } from "react";
import { Text, TouchableOpacity, View, ViewProps } from "react-native";
import { useThemeColors } from "../../hooks/useThemeColors";
import CustomToggle from "../common/CustomToggle";

interface SettingsItemProps extends ViewProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  isRingtone?: boolean;
  ringtoneValue?: string;
  onRingtoneChange?: (value: string) => void;
  ringtoneOptions?: string[];
  onPlayRingtone?: () => void;
}

export default function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  toggleValue,
  onToggle,
  isRingtone = false,
  ringtoneValue,
  onRingtoneChange,
  ringtoneOptions = [],
  onPlayRingtone,
  ...props
}: SettingsItemProps) {
  const colors = useThemeColors();
  const isToggle = typeof toggleValue === "boolean";
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (isRingtone) {
    return (
      <View>
        <TouchableOpacity
          className="flex-row items-center justify-between px-4 py-4"
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <View className="flex-1 flex-row items-center">
            {icon && <View className="mr-3">{icon}</View>}
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-gray-primary">
                {title}
              </Text>
              {subtitle && (
                <Text className="mt-0.5 text-xs text-gray-secondary">
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm text-gray-secondary">
                {ringtoneValue}
              </Text>
              <ChevronDown size={16} color="#9CA3AF" />
            </View>
            <TouchableOpacity
              className="rounded-full bg-orange-primary p-2"
              onPress={onPlayRingtone}
            >
              <Play size={16} color="white" fill="white" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {dropdownOpen && (
          <View className="border-t border-gray-100 bg-gray-50">
            {ringtoneOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0"
                onPress={() => {
                  onRingtoneChange?.(option);
                  setDropdownOpen(false);
                }}
              >
                <Text
                  className={
                    option === ringtoneValue
                      ? "font-semibold text-gray-primary"
                      : "text-gray-secondary"
                  }
                >
                  {option}
                </Text>
                {option === ringtoneValue && (
                  <View className="h-2 w-2 rounded-full bg-orange-primary" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isToggle || !onPress}
      className="flex-row items-center justify-between border-b border-gray-100 bg-white px-5 py-4 gap-1"
    >
      <View className="flex-1 flex-row items-center gap-2 shrink">
        {icon && <View className="mr-3">{icon}</View>}
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-primary">
            {title}
          </Text>
          {subtitle && (
            <Text className="mt-1 text-sm text-gray-secondary">{subtitle}</Text>
          )}
        </View>
      </View>

      {isToggle ? (
        <CustomToggle
          value={toggleValue}
          onValueChange={onToggle || (() => {})}
        />
      ) : showChevron ? (
        <ChevronRight size={20} color={colors.graySecondary} />
      ) : null}
    </TouchableOpacity>
  );
}
