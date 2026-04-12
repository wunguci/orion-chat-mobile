import { CalendarEvent } from "@/types/calendar";
import { formatDate, getEventsForDate } from "@/utils/calendar";
import { Ionicons } from "@expo/vector-icons";

import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import CalendarGrid from "./CalendarGrid";
import EventListItem from "./EventListItem";

interface MonthViewProps {
  initialDate: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onMonthChange?: (date: Date) => void;
  showMonthNavigation?: boolean;
  onCreateAtDate?: (date: Date) => void;
}

export default function MonthView({
  initialDate,
  events,
  onEventPress,
  onMonthChange,
  showMonthNavigation = true,
  onCreateAtDate,
}: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    setCurrentMonth(initialDate.getMonth());
    setCurrentYear(initialDate.getFullYear());
    setSelectedDate(initialDate);
  }, [initialDate]);

  const selectedEvents = getEventsForDate(events, selectedDate);

  const goToPrevMonth = () => {
    const prevDate =
      currentMonth === 0
        ? new Date(currentYear - 1, 11, 1)
        : new Date(currentYear, currentMonth - 1, 1);

    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }

    onMonthChange?.(prevDate);
  };

  const goToNextMonth = () => {
    const nextDate =
      currentMonth === 11
        ? new Date(currentYear + 1, 0, 1)
        : new Date(currentYear, currentMonth + 1, 1);

    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }

    onMonthChange?.(nextDate);
  };

  return (
    <View className="flex-1 bg-white">
      {showMonthNavigation && (
        <View className="flex-row items-center justify-between px-4 py-3 bg-white">
          <TouchableOpacity onPress={goToPrevMonth} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#6B7280" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-gray-900">
            {formatDate(new Date(currentYear, currentMonth), "month")}
          </Text>

          <TouchableOpacity onPress={goToNextMonth} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView>
        <CalendarGrid
          month={currentMonth}
          year={currentYear}
          events={events}
          selectedDate={selectedDate}
          onDatePress={(date) => {
            setSelectedDate(date);
            onCreateAtDate?.(date);
          }}
        />

        {/* event list */}
        <View className="px-4 py-4">
          <Text className="text-xs font-semibold text-teal-primary mb-3 uppercase tracking-wider">
            Events for {formatDate(selectedDate, "full")}
          </Text>

          {selectedEvents.length === 0 ? (
            <Text className="text-sm text-gray-500 text-center py-8">
              No events scheduled
            </Text>
          ) : (
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
