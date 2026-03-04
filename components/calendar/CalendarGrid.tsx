import { CalendarEvent } from "@/types/calendar";
import { getEventsForDate, getMonthData, isSameDay } from "@/utils/calendar";
import { Text, View } from "react-native";
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
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <View className="bg-white px-4 py-3">
      {/* week day headers */}
      <View className="flex-row mb-2">
        {weekDays.map((day, index) => (
          <View key={index} className="flex-1 items-center py-2">
            <Text className="text-xs font-medium text-gray-500">{day}</Text>
          </View>
        ))}
      </View>

      {/* calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} className="flex-row">
          {week.map((day, dayIndex) => {
            const absDay = Math.abs(day);
            const isCurrentMonth = day > 0;

            let actualMonth = month;
            let actualDay = day;

            if (day < 0) {
              if (absDay > 100) {
                // Tháng sau
                actualMonth = month + 1;
                actualDay = absDay - 100;
              } else {
                // Tháng trước
                actualMonth = month - 1;
                actualDay = absDay;
              }
            } else {
              // Tháng hiện tại
              actualDay = day;
            }

            const date = new Date(year, actualMonth, actualDay);
            const dayEvents = getEventsForDate(events, date);
            const hasEvents = dayEvents.length > 0;
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selectedDate);

            return (
              <DayCell
                key={dayIndex}
                day={actualDay}
                hasEvents={hasEvents}
                isSelected={isSelected}
                isToday={isToday}
                isCurrentMonth={isCurrentMonth}
                onPress={() => onDatePress(date)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
