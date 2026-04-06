import { Menu } from "lucide-react-native";
import { DrawerActions } from "@react-navigation/native";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import CustomTabBar from "./CustomTabBar";

const PRIMARY_ORANGE = "#ee652b";

function HamburgerButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.hamburger}
      activeOpacity={0.7}
    >
      <Menu size={24} color={PRIMARY_ORANGE} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#D6F2F2" },
        sceneStyle: { backgroundColor: "#D6F2F2" },
        headerLeft: () => (
          <HamburgerButton
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Tin nhắn" }} />
      <Tabs.Screen name="explore" options={{ title: "Danh bạ" }} />
      <Tabs.Screen name="calendar" options={{ title: "Lịch" }} />
      <Tabs.Screen name="setting" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  hamburger: {
    marginLeft: 16,
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#D6F2F2",
  },
});
