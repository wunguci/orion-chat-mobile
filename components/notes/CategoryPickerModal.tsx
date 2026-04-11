import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NoteCategory } from "@/types/note";
import { useState } from "react";

interface CategoryPickerModalProps {
  visible: boolean;
  categories: NoteCategory[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
  onAddCategory?: (name: string) => void;
  onClose: () => void;
}

export default function CategoryPickerModal({
  visible,
  categories,
  selectedCategoryId,
  onSelect,
  onAddCategory,
  onClose,
}: CategoryPickerModalProps) {
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
    onClose();
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed || !onAddCategory) return;
    onAddCategory(trimmed);
    setNewCategoryName("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/50 justify-end"
      >
        <View className="bg-white rounded-t-3xl">
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          <Text className="text-lg font-semibold text-gray-primary px-4 mb-2">
            Select Category
          </Text>

          {categories.map((cat, index) => (
            <TouchableOpacity
              key={cat.categoryId}
              onPress={() => handleSelect(cat.categoryId)}
              className={`py-4 px-4 flex-row justify-between items-center ${
                index < categories.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              <Text
                className={`text-base ${
                  selectedCategoryId === cat.categoryId
                    ? "text-green-primary font-semibold"
                    : "text-gray-primary"
                }`}
              >
                {cat.name}
              </Text>

              {selectedCategoryId === cat.categoryId && (
                <Ionicons name="checkmark" size={22} color="#14b8a6" />
              )}
            </TouchableOpacity>
          ))}

          <View className="mt-2 border-t border-gray-200 px-4 pt-3">
            <View className="flex-row items-center rounded-xl bg-gray-100 px-3 py-2">
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="New category..."
                placeholderTextColor="#94a3b8"
                className="flex-1 text-gray-primary"
                onSubmitEditing={handleAddCategory}
              />
              <TouchableOpacity
                onPress={handleAddCategory}
                className="h-7 w-7 items-center justify-center rounded-lg bg-green-primary"
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="h-8" />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
