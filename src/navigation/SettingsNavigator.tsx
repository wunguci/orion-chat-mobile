import { Stack } from "expo-router";
import React from "react";

export default function SettingsNavigator() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: "#D6F2F2",
        },
        headerTintColor: "#ee652b",
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: {
          backgroundColor: "#D6F2F2",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          headerShown: false,
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
        name="notification-setting"
        options={{
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          title: "Security & Privacy",
        }}
      />
    </Stack>
  );
}
