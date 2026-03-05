import { CalendarEvent } from "@/types/calendar";
import { getWeekDates } from "@/utils/calendar";
import { isSameDay } from "date-fns";
import { ScrollView, Text, View } from "react-native";
import EventCard from "./EventCard";

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

export default function WeekView({
  date,
  events,
  onEventPress,
}: WeekViewProps) {
  const weekDates = getWeekDates(date);
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const HOUR_HEIGHT = 80;
  const START_HOUR = 8;
  const END_HOUR = 17;

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );

  const getDayEvents = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startTime), date));
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

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
        <View className="w-16" />
        {weekDates.map((d, index) => {
          const isToday = new Date().toDateString() === d.toDateString();

          return (
            <View key={index} className="flex-1 items-center py-3">
              <Text className="text-xs text-gray-500 mb-1">
                {dayNames[index]}
              </Text>
              <View
                className={`w-10 h-10 items-center justify-center rounded-lg ${
                  isToday ? "bg-green-primary" : ""
                }`}
              >
                <Text
                  className={`text-lg font-semibold ${
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
          <View className="w-16 border-r border-gray-200">
            {hours.map((hour) => {
              const displayHour = hour % 12 || 12;
              const ampm = hour >= 12 ? "PM" : "AM";

              return (
                <View
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-b border-gray-200 pt-1 pr-2"
                >
                  <Text className="text-xs text-gray-400 text-right">
                    {displayHour.toString().padStart(2, "0")} {ampm}
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
                    <View
                      key={hour}
                      style={{ height: HOUR_HEIGHT }}
                      className="border-b border-gray-200"
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
                          top: top,
                          left: 4,
                          right: 4,
                          height: Math.max(height, 60),
                        }}
                      >
                        <EventCard
                          event={event}
                          onPress={() => onEventPress(event)}
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
