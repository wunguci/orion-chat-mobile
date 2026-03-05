import { CalendarEvent } from "@/types/calendar";
import { ScrollView, View } from "react-native";
import MonthGrid from "./MonthGrid";

interface YearViewProps {
  year: number;
  events: CalendarEvent[];
  onMonthPress: (month: number) => void;
}

export default function YearView({
  year,
  events,
  onMonthPress,
}: YearViewProps) {
  const months = Array.from({ length: 12 }, (_, i) => i);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-4">
        <View className="flex-row flex-wrap">
          {months.map((month) => (
            <View key={month} className="w-1/3 p-2">
              <MonthGrid
                month={month}
                year={year}
                events={events}
                isCurrentMonth={year === currentYear && month === currentMonth}
                onPress={() => onMonthPress(month)}
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
