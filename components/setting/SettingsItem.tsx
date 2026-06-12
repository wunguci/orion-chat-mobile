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
              <Text
                className="text-base font-semibold"
                style={{ color: colors.text }}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  className="mt-0.5 text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {ringtoneValue}
              </Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </View>
            <TouchableOpacity
              className="rounded-full p-2"
              style={{ backgroundColor: colors.primary }}
              onPress={onPlayRingtone}
            >
              <Play size={16} color="white" fill="white" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {dropdownOpen && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            {ringtoneOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className="flex-row items-center justify-between px-4 py-3"
                style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
                onPress={() => {
                  onRingtoneChange?.(option);
                  setDropdownOpen(false);
                }}
              >
                <Text
                  className={option === ringtoneValue ? "font-semibold" : ""}
                  style={{
                    color:
                      option === ringtoneValue
                        ? colors.text
                        : colors.textSecondary,
                  }}
                >
                  {option}
                </Text>
                {option === ringtoneValue && (
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
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
      className="flex-row items-center justify-between px-5 py-4 gap-1"
      style={{
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View className="flex-1 flex-row items-center gap-2 shrink">
        {icon && <View className="mr-3">{icon}</View>}
        <View className="flex-1">
          <Text className="text-base font-medium" style={{ color: colors.text }}>
            {title}
          </Text>
          {subtitle && (
            <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
              {subtitle}
            </Text>
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
