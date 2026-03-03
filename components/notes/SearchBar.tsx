import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export default function SearchBar({
    value, onChangeText, placeholder = "Search your notes..."
}: SearchBarProps) {
    return (
        <View className="mx-4 mt-2 mb-2 bg-gray-light rounded-xl px-4 py-2 flex-row items-center">
            < Ionicons name="search" size={30} color="#94a3b8"/>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-2 text-base text-gray-primary"
            >
            </TextInput>
        </View>
    )
}