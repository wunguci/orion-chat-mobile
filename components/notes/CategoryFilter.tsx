import type { NoteCategory } from "@/types/note";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface CategoryFilterProps {
  categories: NoteCategory[];
  selectedCategoryId: string | "all";
  onSelectCategoryId: (categoryId: string | "all") => void;
}

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategoryId,
}: CategoryFilterProps) {
  const items = [
    { key: "all", label: "All" },
    ...categories.map((category) => ({
      key: category.categoryId,
      label: category.name,
    })),
  ];

  return (
    <View className="mb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        style={{ flexGrow: 0 }}
      >
        {items.map((category) => {
          const isSelected = selectedCategoryId === category.key;
          return (
            <TouchableOpacity
              key={category.key}
              onPress={() => onSelectCategoryId(category.key)}
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
