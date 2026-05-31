import { Drawer } from "expo-router/drawer";
import {
  DrawerActions,
  getFocusedRouteNameFromRoute,
} from "@react-navigation/native";
import { Menu } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import CustomDrawerContent from "./CustomDrawerContent";

function HamburgerButton({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginLeft: 12,
        padding: 4,
        borderRadius: 8,
        backgroundColor: colors.primaryLight,
      }}
      activeOpacity={0.7}
    >
      <Menu size={20} color={colors.primary} strokeWidth={2} />
    </TouchableOpacity>
  );
}

function getMainTitle(route: any) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? "index";

  switch (routeName) {
    case "explore":
      return "Danh bạ";
    case "calendar":
      return "Lịch";
    case "setting":
      return "Profile";
    case "index":
    default:
      return "Tin nhắn";
  }
}

export default function DrawerNavigator() {
  const colors = useThemeColors();

  return (
    <Drawer
      initialRouteName="(main)"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "600",
          fontSize: 16,
        },
        headerTintColor: colors.primary,
        headerLeft: () => (
          <HamburgerButton
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />
        ),
        drawerType: "slide",
        drawerPosition: "left",
        drawerStyle: {
          backgroundColor: colors.card,
          width: 260,
        },
        overlayColor: `${colors.primary}29`,
        swipeEdgeWidth: 60,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      })}
    >
      <Drawer.Screen
        name="(main)"
        options={({ route }) => ({
          title: getMainTitle(route),
          drawerItemStyle: { display: "none" },
        })}
      />

      <Drawer.Screen
        name="index"
        options={{
          title: "Tin nhắn",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="ai"
        options={{
          title: "AI Chatbot",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="notes"
        options={{
          title: "Ghi chú",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="work-hub"
        options={{
          title: "WorkHub",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="video-call"
        options={{
          title: "Video Call",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="group-call"
        options={{
          title: "Group Call",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
}
