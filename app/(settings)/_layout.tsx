import { Stack } from "expo-router";
import React from "react";

const WH_GREEN_PRIMARY = "#0d9488";
const WH_GREEN_BG_LIGHT = "#f5f7fa";
const WH_GREEN_TEXT_PRIMARY = "#1e293b";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Quay lại",
        headerStyle: {
          backgroundColor: WH_GREEN_BG_LIGHT,
        },
        headerTintColor: WH_GREEN_PRIMARY,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
          color: WH_GREEN_TEXT_PRIMARY,
        },
        contentStyle: {
          backgroundColor: WH_GREEN_BG_LIGHT,
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
        name="mobile-config"
        options={{
          title: "Cấu hình Mobile",
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
