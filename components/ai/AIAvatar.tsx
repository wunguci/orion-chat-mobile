import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AIAvatarProps {
  size?: number;
}

export function AIAvatar({ size = 40 }: AIAvatarProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#00B48D",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name="sparkles" size={size * 0.5} color="white" />
    </View>
  );
}
