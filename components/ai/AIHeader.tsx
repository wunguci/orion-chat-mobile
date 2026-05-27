import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Menu } from "lucide-react-native";
import { AIAvatar } from "./AIAvatar";
import { useSlideMenu } from "@/context/SlideMenuContext";

export function AIHeader() {
  const router = useRouter();
  const { openMenu } = useSlideMenu();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingTop: insets.top - 13,
        paddingBottom: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 0,
        borderBottomColor: "#E5E5EA",
      }}
    >
      {/* Left: Hamburger + Avatar + Name */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {/* <TouchableOpacity
          onPress={openMenu}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: "#ccfbf1",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={21} color="#0d9488" strokeWidth={2} />
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={openMenu}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: "#ccfbf1",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={20} color="#0d9488" strokeWidth={2.5} />
        </TouchableOpacity>
        <AIAvatar size={36} />
        <View>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#000" }}>
            Orion AI
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: "#22c55e",
              }}
            />
            <Text style={{ fontSize: 11, color: "#6b7280" }}>Always active</Text>
          </View>
        </View>
      </View>

      {/* Right: Action Buttons */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        {/* New Chat */}
        <TouchableOpacity>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#0d9488",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={20} color="white" />
          </View>
        </TouchableOpacity>

        {/* History */}
        <TouchableOpacity onPress={() => router.push("/ai/history")}>
          <Ionicons name="time-outline" size={24} color="#000" />
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
