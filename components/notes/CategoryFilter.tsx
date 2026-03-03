import { NoteCategory } from "@/types/note";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface CategoryFilterProps {
  selectedCategory: "all" | NoteCategory;
  onSelectCategory: (category: "all" | NoteCategory) => void;
}

const CATEGORIES = [
  { key: "all" as const, label: "All" },
  { key: "finance" as const, label: "Finance" },
  { key: "sport" as const, label: "Sport" },
  { key: "personal" as const, label: "Personal" },
];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <View className="mb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        style={{ flexGrow: 0 }}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.key;
          return (
            <TouchableOpacity
              key={category.key}
              onPress={() => onSelectCategory(category.key)}
              className={`px-4 py-1.5 rounded-full ${
                isSelected ? "bg-green-primary" : "bg-gray-light"
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-sm ${
                  isSelected ? "text-white font-medium" : "text-gray-primary"
                }`}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
