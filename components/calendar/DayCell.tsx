import { View, Text, TouchableOpacity } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

interface DayCellProps {
    day: number;
    hasEvents: boolean;
    isSelected: boolean;
    isToday: boolean;
    isCurrentMonth: boolean;
    onPress: () => void;
}

export default function DayCell({
    day,
    hasEvents,
    isSelected,
    isToday,
    isCurrentMonth,
    onPress,
}: DayCellProps) {
    const absDay = Math.abs(day);
    const colors = useThemeColors();

    return (
        <TouchableOpacity 
            onPress={onPress}
            disabled={!isCurrentMonth}
            className="flex-1 aspect-square items-center justify-center p-1"
            activeOpacity={0.7}
        >
            <View
                className="w-10 h-10 items-center justify-center rounded-full"
                style={
                    isSelected
                    ? { backgroundColor: colors.primary }
                    : isToday
                    ? { borderWidth: 2, borderColor: colors.primary }
                    : {}
                }
            >
                <Text
                    className={`text-base font-medium ${
                        isSelected
                        ? 'text-white'
                        : !isCurrentMonth
                        ? 'text-gray-300'
                        : 'text-gray-900'
                    }`}
                    style={
                        !isSelected && isToday
                        ? { color: colors.primary }
                        : {}
                    }
                >
                    {absDay}
                </Text>
            </View>

            {hasEvents && isCurrentMonth && (
                <View className="flex-row gap-1 mt-1">
                    <View style={{ backgroundColor: colors.primary }} className="w-1 h-1 rounded-full"/>
                    <View style={{ backgroundColor: colors.primary }} className="w-1 h-1 rounded-full"/>
                </View>
            )}
        </TouchableOpacity>
    )
}