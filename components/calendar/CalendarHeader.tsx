import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface CalendarHeaderProps {
    title: string;
    onSearchPress: () => void;
    onMenuPress: () => void;
}

export default function CalendarHeader({
    title,
    onSearchPress,
    onMenuPress,
}: CalendarHeaderProps) {
    const {colors} = useTheme();

    return (
      <View className="border-b border-gray-200 bg-white px-4 py-5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar" size={24} color={colors.textSecondary}/>
          <Text className="text-xl font-semibold text-gray-primary">{title}</Text>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={onSearchPress} activeOpacity={0.7}>
            <Ionicons name="search" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMenuPress} activeOpacity={0.7}>
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
}