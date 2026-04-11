import { View, Text, TouchableOpacity } from "react-native";

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

    return (
        <TouchableOpacity 
            onPress={onPress}
            disabled={!isCurrentMonth}
            className="flex-1 aspect-square items-center justify-center p-1"
            activeOpacity={0.7}
        >
            <View
                className={`w-10 h-10 items-center justify-center rounded-full ${
                    isSelected
                    ? 'bg-green-primary'
                    : isToday
                    ? 'border-2 border-green-primary'
                    : ''
                }`}
            >
                <Text
                    className={`text-base font-medium ${
                        isSelected
                        ? 'text-white'
                        : !isCurrentMonth
                        ? 'text-gray-300'
                        : isToday
                        ? 'text-green-primary'
                        : 'text-gray-900'
                    }`}
                >
                    {absDay}
                </Text>
            </View>

            {hasEvents && isCurrentMonth && (
                <View className="flex-row gap-1 mt-1">
                    <View className="w-1 h-1 rounded-full bg-green-primary"/>
                    <View className="w-1 h-1 rounded-full bg-green-primary"/>
                </View>
            )}
        </TouchableOpacity>
    )
}