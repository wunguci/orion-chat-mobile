import { CalendarEvent } from "@/types/calendar";
import { getEventsForDate, getMonthData } from "@/utils/calendar";
import { Text, TouchableOpacity, View } from "react-native";

interface MonthGridProps {
  month: number;
  year: number;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  onPress: () => void;
}

export default function MonthGrid({
  month,
  year,
  events,
  isCurrentMonth,
  onPress,
}: MonthGridProps) {
  const weeks = getMonthData(year, month);
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`p-3 rounded-lg ${isCurrentMonth ? "bg-teal-50" : "bg-gray-50"}`}
    >
      {/* month name */}
      <Text className="text-xs font-semibold text-gray-600 mb-2 text-center">
        {monthNames[month]}
      </Text>

      {/* week days */}
      <View className="flex-row mb-1">
        {weekDays.map((day, i) => (
          <Text key={i} className="flex-1 text-[8px] text-gray-400 text-center">
            {day}
          </Text>
        ))}
      </View>

      {/* days grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} className="flex-row">
          {week.map((day, dayIndex) => {
            const isDayInCurrentMonth = day > 0 && day < 100;
            const isPrevMonth = day < 0 && day > -100;
            const isNextMonth = day <= -100;

            let displayDay: number;
            if (isPrevMonth) {
              displayDay = Math.abs(day);
            } else if (isNextMonth) {
              displayDay = Math.abs(day) - 100;
            } else {
              displayDay = day;
            }

            const date = new Date(
              year,
              isPrevMonth ? month - 1 : isNextMonth ? month + 1 : month,
              displayDay,
            );
            const dayEvents = getEventsForDate(events, date);
            const hasEvents = dayEvents.length > 0;

            return (
              <View key={dayIndex} className="flex-1 items-center py-0.5">
                {isDayInCurrentMonth ? (
                  <>
                    <Text className="text-[10px] text-gray-700">
                      {displayDay}
                    </Text>
                    {hasEvents && (
                      <View className="w-1 h-1 rounded-full bg-teal-500 mt-0.5" />
                    )}
                  </>
                ) : (
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </TouchableOpacity>
  );
}
