import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsSection from "@/components/setting/SettingsSection";
import { useThemeColors } from "@/hooks/useThemeColors";
import { MonitorCog, Moon, RotateCcw, Sun } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ThemeMode = "light" | "dark" | "system";
type TextSize = "small" | "medium" | "large";

const wallpapers = [
  { id: 1, color: "#20C997", label: "Teal" },
  { id: 2, color: "#FF6B3D", label: "Orange" },
  { id: 3, color: "#A8C5DA", label: "Blue" },
  { id: 4, color: "#E5DDD0", label: "Beige" },
];

export default function AppearanceScreen() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [selectedWallpaper, setSelectedWallpaper] = useState(1);
  const [textSize, setTextSize] = useState<TextSize>("medium");
  const colors = useThemeColors();

  const themeOptions: { value: ThemeMode; label: string; Icon: any }[] = [
    {
      value: "light",
      label: "Light",
      Icon: Sun,
    },
    {
      value: "dark",
      label: "Dark",
      Icon: Moon,
    },
    {
      value: "system",
      label: "System",
      Icon: MonitorCog,
    },
  ];

  const textSizeOptions: { value: TextSize; label: string }[] = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 pb-4 bg-gray-50">
        {/* Theme Mode Section */}
        <SettingsSection title="THEME MODE">
          <View className="overflow-hidden rounded-3xl bg-orange-bg-light border border-orange-border-light p-6">
            <View className="flex-row gap-4">
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setThemeMode(option.value)}
                  className={`flex-1 items-center rounded-3xl py-8 px-2 ${
                    themeMode === option.value
                      ? "border border-orange-primary bg-white"
                      : "border border-gray-border bg-white"
                  }`}
                >
                  <option.Icon
                    size={24}
                    color={
                      themeMode === option.value
                        ? colors.orangePrimary
                        : colors.orangeBgHeavy
                    }
                  />
                  <Text
                    className={`mt-3 text-base font-semibold ${
                      themeMode === option.value
                        ? "text-gray-primary"
                        : "text-gray-secondary"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SettingsSection>

        {/* Chat Wallpaper Section */}
        <SettingsSection title="CHAT WALLPAPER">
          <View className="mb-4 flex-row items-center justify-between px-4">
            <View />
            <TouchableOpacity>
              <Text className="text-base font-semibold text-orange-primary">
                See all
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3 px-4">
            {wallpapers.map((wallpaper) => (
              <TouchableOpacity
                key={wallpaper.id}
                onPress={() => setSelectedWallpaper(wallpaper.id)}
                className="flex-1"
              >
                <View
                  className={`h-56 w-full rounded-3xl ${
                    selectedWallpaper === wallpaper.id
                      ? "border-2 border-orange-primary"
                      : "border-2 border-gray-secondary"
                  }`}
                  style={{ backgroundColor: wallpaper.color }}
                >
                  {wallpaper.id === 3 && (
                    <View className="flex-1 items-center justify-center">
                      <View
                        className="flex-row flex-wrap justify-center gap-2"
                        style={{ width: 60 }}
                      >
                        {Array(9)
                          .fill(null)
                          .map((_, i) => (
                            <View
                              key={i}
                              className="h-2.5 w-2.5 rounded-full bg-white opacity-70"
                            />
                          ))}
                      </View>
                    </View>
                  )}
                  {wallpaper.id === 4 && (
                    <View className="flex-1 items-center justify-center gap-3">
                      <View className="flex-row gap-3">
                        <View className="h-4 w-4 rounded-md bg-white opacity-60" />
                        <View className="h-4 w-4 rounded-md bg-white opacity-60" />
                      </View>
                      <View className="flex-row gap-3">
                        <View className="h-4 w-4 rounded-md bg-white opacity-60" />
                        <View className="h-4 w-4 rounded-md bg-white opacity-60" />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </SettingsSection>

        {/* Text Size Section */}
        <SettingsSection title="TEXT SIZE">
          <View className="overflow-hidden rounded-3xl p-2">
            <View className="flex-row gap-3 border border-orange-border-light rounded-3xl px-3 py-3 bg-orange-bg-light">
              {textSizeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setTextSize(option.value)}
                  className={`flex-1 items-center rounded-full py-2 ${
                    textSize === option.value
                      ? "border border-orange-border-light bg-white"
                      : ""
                  }`}
                  style={
                    textSize === option.value
                      ? {
                          shadowColor: "#424242",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                        }
                      : {}
                  }
                >
                  <Text
                    className={`text-base font-semibold ${
                      textSize === option.value
                        ? "text-gray-primary"
                        : "text-gray-600"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="mt-4 text-sm leading-5 text-gray-secondary">
              Adjusting the font size will change the scale all chat text across
              the app.
            </Text>
          </View>
        </SettingsSection>

        {/* Reset Button */}
        <View className="mt-8 px-4">
          <TouchableOpacity className="flex-row items-center gap-2">
            <RotateCcw size={22} color={colors.orangePrimary} />
            <Text className="text-base font-semibold text-orange-primary">
              Reset to default settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="mt-10 gap-3 px-4 pb-6">
          <TouchableOpacity className="rounded-full border-2 border-gray-border bg-white py-4">
            <Text className="text-center text-lg font-bold text-gray-primary">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="rounded-full bg-orange-primary py-4">
            <Text className="text-center text-lg font-bold text-white">
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
