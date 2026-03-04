import { View, Text } from "react-native";
import { CalendarEvent } from "@/types/calendar";
import { getMonthData, isSameDay, getEventsForDate } from "@/utils/calendar";
import DayCell from "./DayCell";

interface CalendarGridProps {
    month: number;
    year: number;
    events: CalendarEvent[];
    selectedDate: Date;
    onDatePress: (date: Date) => void;
}

export default function CalendarGrid({
    month,
    year,
    events,
    selectedDate,
    onDatePress,
}: CalendarGridProps) {
    const weeks = getMonthData(year, month);
    const today = new Date();
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <View className="bg-white px-4 py-3">
            {/* week day headers */}
            <View className="flex-row mb-2">
                {weekDays.map((day, index) => (
                    <View key={index} className="flex-1 items-center py-2">
                        <Text className="text-xs font-medium text-gray-500">
                            {day}
                        </Text>
                    </View>
                ))}
            </View>

            {/* calendar grid */}
            {weeks.map((week, weekIndex) => (
                <View key={weekIndex} className="flex-row">
                    {week.map((day, dayIndex) => {
                        const absDay = Math.abs(day);
                    })}
                </View>
            ))}
        </View>
    )
}