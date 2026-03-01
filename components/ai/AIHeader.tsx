import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AIAvatar } from "./AIAvatar";

export function AIHeader() {
  const router = useRouter();

  return (
    <View
      className="flex-row items-center justify-between px-4 py-3 bg-white"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
      }}
    >
      {/* Left: Avatar + Name */}
      <View className="flex-row items-center gap-3">
        <AIAvatar size={36} />
        <View>
          <Text className="text-base font-semibold text-black">
            AI Assistant
          </Text>
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-xs text-gray-500">Always active</Text>
          </View>
        </View>
      </View>

      {/* Right: Action Buttons */}
      <View className="flex-row items-center gap-4">
        {/* New Chat */}
        <TouchableOpacity>
          <View className="w-8 h-8 rounded-full bg-teal-500 items-center justify-center">
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

        {/* Menu */}
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
