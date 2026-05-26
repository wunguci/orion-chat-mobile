import { CalendarEvent } from "@/types/calendar";
import { getWeekDates } from "@/utils/calendar";
import { isSameDay } from "date-fns";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import EventCard from "./EventCard";

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onCreateAtDate?: (date: Date) => void;
}

export default function WeekView({
  date,
  events,
  onEventPress,
  onCreateAtDate,
}: WeekViewProps) {
  const weekDates = getWeekDates(date);
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const HOUR_HEIGHT = 80;
  const START_HOUR = 0;
  const END_HOUR = 23;

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );

  const getDayEvents = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start), date));
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);

    const top =
      (start.getHours() - START_HOUR) * HOUR_HEIGHT +
      (start.getMinutes() / 60) * HOUR_HEIGHT;

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const height = durationHours * HOUR_HEIGHT;

    return { top, height };
  };

  return (
    <View className="flex-1 bg-white">
      {/* week header */}
      <View className="flex-row bg-white border-b border-gray-200">
        <View className="w-14" />
        {weekDates.map((d, index) => {
          const isToday = new Date().toDateString() === d.toDateString();

          return (
            <View key={index} className="flex-1 items-center py-2">
              <Text className="text-[10px] font-medium tracking-wide text-gray-500 mb-1">
                {dayNames[index]}
              </Text>
              <View
                className={`w-9 h-9 items-center justify-center rounded-lg ${
                  isToday ? "bg-green-primary" : ""
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isToday ? "text-white" : "text-gray-900"
                  }`}
                >
                  {d.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView>
        <View className="flex-row">
          {/* time col */}
          <View className="w-14 border-r border-gray-200">
            {hours.map((hour) => {
              const displayHour = hour % 12 || 12;
              const ampm = hour >= 12 ? "PM" : "AM";

              return (
                <View
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-b border-gray-200 pt-1 pr-1"
                >
                  <Text className="text-[10px] text-gray-400 text-right">
                    {hour === 0
                      ? "12 AM"
                      : hour < 12
                        ? `${displayHour} AM`
                        : hour === 12
                          ? "12 PM"
                          : `${displayHour} PM`}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* day cols with events */}
          <View className="flex-1 flex-row">
            {weekDates.map((weekDate, dayIndex) => {
              const dayEvents = getDayEvents(weekDate);

              return (
                <View
                  key={dayIndex}
                  className="flex-1 border-r border-gray-200"
                >
                  {/* background grid */}
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={{ height: HOUR_HEIGHT }}
                      className="border-b border-gray-200"
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!onCreateAtDate) return;
                        const slotDate = new Date(weekDate);
                        slotDate.setHours(hour, 0, 0, 0);
                        onCreateAtDate(slotDate);
                      }}
                    />
                  ))}

                  {/* events overlay */}
                  {dayEvents.map((event) => {
                    const { top, height } = getEventPosition(event);

                    return (
                      <View
                        key={event.id}
                        style={{
                          position: "absolute",
                          top: Math.max(top + 2, 2),
                          left: 3,
                          right: 3,
                          height: Math.max(height, 40),
                          overflow: "hidden",
                        }}
                      >
                        <EventCard
                          event={event}
                          onPress={() => onEventPress(event)}
                          compact
                        />
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
