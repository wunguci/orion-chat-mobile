import { CalendarEvent } from "@/types/calendar";
import { getEventsForDate } from "@/utils/calendar";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "@/utils/calendar";
import { useState } from "react";
import { TouchableOpacity, View, Text, ScrollView } from "react-native";
import CalendarGrid from "./CalendarGrid";
import EventListItem from "./EventListItem";

interface MonthViewProps {
  initialDate: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

export default function MonthView({
  initialDate,
  events,
  onEventPress,
}: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const selectedEvents = getEventsForDate(events, selectedDate);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* month navigation */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white">
        <TouchableOpacity onPress={goToPrevMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#6B7280"/>
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatDate(new Date(currentYear, currentMonth), 'month')}
        </Text>

        <TouchableOpacity onPress={goToNextMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color="#6B7280"/>
        </TouchableOpacity>
      </View>

      <ScrollView >
        <CalendarGrid 
          month={currentMonth}
          year={currentYear}
          events={events}
          selectedDate={selectedDate}
          onDatePress={setSelectedDate}
        />

        {/* event list */}
        <View className="px-4 py-4">
          <Text className="text-xs font-semibold text-teal-primary mb-3 uppercase tracking-wider">
            Events for {formatDate(selectedDate, 'full')}
          </Text>

          {selectedEvents.length === 0 ? (
            <Text className="text-sm text-gray-500 text-center py-8">
              No events scheduled
            </Text>
          ): (
            selectedEvents.map((event) => (
              <EventListItem 
                key={event.id}
                event={event}
                onPress={() => onEventPress(event)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
