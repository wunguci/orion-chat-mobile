import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsSection from "@/components/setting/SettingsSection";
import {
  AppearanceThemeMode,
  getAppearanceColorFromWallpaper,
} from "@/constants/appearance";
import { useAppearance } from "@/context/AppearanceContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { MonitorCog, Moon, RotateCcw, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TextSize = "small" | "medium" | "large";

const wallpapers = [
  { id: "teal", color: "#20C997", label: "Teal" },
  { id: "orange", color: "#FF6B3D", label: "Orange" },
  { id: "blue", color: "#A8C5DA", label: "Blue" },
  { id: "purple", color: "#A78BFA", label: "Purple" },
];

export default function AppearanceScreen() {
  const { settings, updateAppearance } = useAppearance();
  const [themeMode, setThemeMode] = useState<AppearanceThemeMode>("light");
  const [selectedWallpaper, setSelectedWallpaper] = useState("teal");
  const [textSize, setTextSize] = useState<TextSize>("medium");
  const colors = useThemeColors();

  useEffect(() => {
    setThemeMode(settings.theme);
    setSelectedWallpaper(settings.wallpaper || "teal");
    setTextSize(
      settings.fontSize && settings.fontSize >= 18
        ? "large"
        : settings.fontSize && settings.fontSize <= 14
          ? "small"
          : "medium",
    );
  }, [settings]);

  const themeOptions: { value: AppearanceThemeMode; label: string; Icon: any }[] = [
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

  const handleSave = async () => {
    const fontSize = textSize === "large" ? 18 : textSize === "small" ? 14 : 16;

    await updateAppearance({
      theme: themeMode,
      wallpaper: selectedWallpaper,
      appearanceColor: getAppearanceColorFromWallpaper(selectedWallpaper),
      fontSize,
    });

    Alert.alert("Appearance", "Đã lưu giao diện.");
  };

  const handleReset = () => {
    setThemeMode("light");
    setSelectedWallpaper("teal");
    setTextSize("medium");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Theme Mode Section */}
        <SettingsSection title="THEME MODE">
          <View
            style={{
              overflow: "hidden",
              borderRadius: 24,
              backgroundColor: colors.primaryLight,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 24,
            }}
          >
            <View className="flex-row gap-4">
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setThemeMode(option.value)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    borderRadius: 24,
                    paddingVertical: 32,
                    paddingHorizontal: 8,
                    borderWidth: 1,
                    borderColor:
                      themeMode === option.value ? colors.primary : colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  <option.Icon
                    size={24}
                    color={
                      themeMode === option.value
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={{
                      marginTop: 12,
                      color:
                        themeMode === option.value
                          ? colors.text
                          : colors.textSecondary,
                      fontSize: 16,
                      fontWeight: "600",
                    }}
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
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
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
                  style={{
                    height: 224,
                    width: "100%",
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor:
                      selectedWallpaper === wallpaper.id
                        ? colors.primary
                        : colors.textSecondary,
                    backgroundColor: wallpaper.color,
                  }}
                >
                  {wallpaper.id === "blue" && (
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
                  {wallpaper.id === "purple" && (
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
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 24,
                paddingHorizontal: 12,
                paddingVertical: 12,
                backgroundColor: colors.primaryLight,
              }}
            >
              {textSizeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setTextSize(option.value)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    borderRadius: 999,
                    paddingVertical: 8,
                    borderWidth: textSize === option.value ? 1 : 0,
                    borderColor: colors.border,
                    backgroundColor:
                      textSize === option.value ? colors.card : "transparent",
                  }}
                >
                  <Text
                  style={
                    {
                      color:
                        textSize === option.value
                          ? colors.text
                          : colors.textSecondary,
                      fontSize: 16,
                      fontWeight: "600",
                    }
                  }
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text
              style={{
                marginTop: 16,
                color: colors.textSecondary,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              Adjusting the font size will change the scale all chat text across
              the app.
            </Text>
          </View>
        </SettingsSection>

        {/* Reset Button */}
        <View className="mt-8 px-4">
          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={handleReset}
          >
            <RotateCcw size={22} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Reset to default settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="mt-10 gap-3 px-4 pb-6">
          <TouchableOpacity
            style={{
              borderRadius: 999,
              borderWidth: 2,
              borderColor: colors.border,
              backgroundColor: colors.card,
              paddingVertical: 16,
            }}
            onPress={() => {
              setThemeMode(settings.theme);
              setSelectedWallpaper(settings.wallpaper || "teal");
            }}
          >
            <Text
              style={{
                color: colors.text,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              borderRadius: 999,
              backgroundColor: colors.primary,
              paddingVertical: 16,
            }}
            onPress={() => void handleSave()}
          >
            <Text className="text-center text-lg font-bold text-white">
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
