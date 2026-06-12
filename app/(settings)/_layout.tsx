import { Stack } from "expo-router";
import React from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function SettingsLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
          color: colors.text,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="profile-settings"
        options={{
          title: "Profile Settings",
        }}
      />
      <Stack.Screen
        name="appearance-setting"
        options={{
          title: "Appearance",
        }}
      />
      <Stack.Screen
        name="linked-devices"
        options={{
          title: "Linked Devices",
        }}
      />
      <Stack.Screen
        name="mobile-config"
        options={{
          title: "Mobile Configuration",
        }}
      />
      <Stack.Screen
        name="notification-setting"
        options={{
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          title: "Privacy & Security",
        }}
      />
    </Stack>
  );
}
