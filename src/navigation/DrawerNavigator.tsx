import { Drawer } from "expo-router/drawer";
import React from "react";
import CustomDrawerContent from "./CustomDrawerContent";

export default function DrawerNavigator() {
  return (
    <Drawer
      initialRouteName="(main)"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        drawerPosition: "left",
        drawerStyle: {
          backgroundColor: "#D6F2F2",
          width: 280,
        },
        overlayColor: "#D6F2F2",
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen
        name="(main)"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="ai"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="notes"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="work-hub"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="video-call"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
}
