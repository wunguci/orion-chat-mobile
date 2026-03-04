import { Modal, TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NoteCategory } from "@/types/note";

interface CategoryPickerModalProps {
    visible: boolean;
    selectedCategory: NoteCategory;
    onSelect: (category: NoteCategory) => void;
    onClose: () => void;
}

const CATEGORIES: { value: NoteCategory; label: string }[] = [
    { value: "finance", label: "Finance" },
    { value: "sport", label: "Sport" },
    { value: "personal", label: "Personal" },
    { value: "work", label: "Work" },
];

export default function CategoryPickerModal({
  visible,
  selectedCategory,
  onSelect,
  onClose,
}: CategoryPickerModalProps) {
    
    const handleSelect = (category: NoteCategory) => {
        onSelect(category);
        onClose();
    }

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
                {/* modal content  */}
                <View className="bg-white rounded-t-3xl">
                    {/* handle bar */}
                    <View className="items-center pt-3 pb-2">
                        <View className="w-12 h-1 bg-gray-300 rounded-full" />
                    </View>

                    {/* title */}
                    <Text className="text-lg font-semibold text-gray-primary px-4 mb-2">
                        Select Category
                    </Text>
                    
                    {/* category list */}
                    {CATEGORIES.map((cat, index) => (
                        <TouchableOpacity 
                            key={cat.value}
                            onPress={() => handleSelect(cat.value)}
                            className={`py-4 px-4 flex-row justify-between items-center ${
                                index < CATEGORIES.length - 1
                                ? 'border-b border-gray-200'
                                : ''
                            }`}
                        >
                            <Text
                                className={`text-base ${
                                    selectedCategory === cat.value
                                    ? 'text-green-primary font-semibold'
                                    : 'text-gray-primary'
                                }`}
                            >
                                {cat.label}
                            </Text>

                            {/* Checkmark khi selected */}
                            {selectedCategory === cat.value && (
                                <Ionicons 
                                    name="checkmark"
                                    size={22}
                                    color="#14b8a6"
                                />
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* safe area bottom */}
                    <View className="h-8" />
                </View>
            </TouchableOpacity>
        </Modal>
    )
}