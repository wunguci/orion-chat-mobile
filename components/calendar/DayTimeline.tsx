import { CalendarEvent } from "@/types/calendar";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import EventCard from "./EventCard";

interface DayTimelineProps {
  date: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onTimeSlotPress?: (date: Date) => void;
  startHour?: number;
  endHour?: number;
}

export default function DayTimeline({
  date,
  events,
  onEventPress,
  onTimeSlotPress,
  startHour = 0,
  endHour = 23,
}: DayTimelineProps) {
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  );
  const HOUR_HEIGHT = 80;

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const top =
      (start.getHours() - startHour) * HOUR_HEIGHT +
      (start.getMinutes() / 60) * HOUR_HEIGHT;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
    const height = duration * HOUR_HEIGHT;
    return { top, height };
  };

  return (
    <ScrollView className="flex-1">
      <View className="relative">
        {/* time slots */}
        {hours.map((hour) => {
          const displayHour = hour % 12 || 12;
          const ampm = hour < 12 ? "AM" : "PM";

          return (
            <View
              key={hour}
              className="flex-row border-b border-gray-200"
              style={{ height: HOUR_HEIGHT }}
            >
              <View className="w-16 items-end pr-2 pt-1">
                <Text className="text-xs text-gray-500">
                  {displayHour.toString().padStart(2, "0")}:00 {ampm}
                </Text>
              </View>
              <TouchableOpacity
                className="flex-1"
                activeOpacity={0.7}
                onPress={() => {
                  if (!onTimeSlotPress) return;
                  const slotDate = new Date(date);
                  slotDate.setHours(hour, 0, 0, 0);
                  onTimeSlotPress(slotDate);
                }}
              />
            </View>
          );
        })}

        {/* events overlay */}
        <View className="absolute left-16 right-0 top-0 bottom-0 px-2">
          {events.map((event) => {
            const { top, height } = getEventPosition(event);
            return (
              <View
                key={event.id}
                className="absolute left-0 right-0"
                style={{ top, height: Math.max(height, 60) }}
              >
                <EventCard event={event} onPress={() => onEventPress(event)} />
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
