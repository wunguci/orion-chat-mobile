import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ActionButton {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const actions: ActionButton[] = [
  {
    id: "summarize",
    label: "Summarize",
    icon: "document-text-outline",
    color: "#3B82F6",
  },
  { id: "write", label: "Write", icon: "create-outline", color: "#10B981" },
  {
    id: "translate",
    label: "Translate",
    icon: "language-outline",
    color: "#F59E0B",
  },
  { id: "code", label: "Code", icon: "code-slash-outline", color: "#8B5CF6" },
];

interface AIActionBarProps {
  onActionPress: (actionId: string) => void;
}

export function AIActionBar({ onActionPress }: AIActionBarProps) {
  return (
    <View className="border-t border-gray-200 bg-white">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => onActionPress(action.id)}
            style={{ marginRight: index < actions.length - 1 ? 12 : 0 }}
          >
            <View className="flex-row items-center px-4 py-2 rounded-full bg-gray-100">
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: action.color + "20",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 8,
                }}
              >
                <Ionicons name={action.icon} size={14} color={action.color} />
              </View>
              <Text className="text-sm font-medium text-black">
                {action.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
