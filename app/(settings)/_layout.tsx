import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Quay lại",
        headerStyle: {
          backgroundColor: "#0a0a0a",
        },
        headerTintColor: "#ee652b",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        contentStyle: {
          backgroundColor: "#0a0a0a",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Cài đặt",
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
        }}
      />
      <Stack.Screen
        name="profile-settings"
        options={{
          title: "Cài đặt hồ sơ",
        }}
      />
      <Stack.Screen
        name="appearance-setting"
        options={{
          title: "Giao diện",
        }}
      />
      <Stack.Screen
        name="linked-devices"
        options={{
          title: "Thiết bị đã liên kết",
        }}
      />
      <Stack.Screen
        name="notification-setting"
        options={{
          title: "Thông báo",
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          title: "Bảo mật & Quyền riêng tư",
        }}
      />
    </Stack>
  );
}
