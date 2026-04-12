import { Tabs } from "expo-router";
import React from "react";
import { whColors } from "@/constants/tailwindColors";
import CustomTabBar from "./CustomTabBar";

export default function BottomTabNavigator() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={() => ({
        headerShown: false,
        sceneStyle: { backgroundColor: whColors.bgHeavy },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Tin nhắn" }} />
      <Tabs.Screen name="explore" options={{ title: "Danh bạ" }} />
      <Tabs.Screen name="calendar" options={{ title: "Lịch" }} />
      <Tabs.Screen name="setting" options={{ title: "Profile" }} />
    </Tabs>
  );
}
