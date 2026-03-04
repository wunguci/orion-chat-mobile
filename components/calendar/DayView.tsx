import { View, Text } from "react-native";
import { CalendarEvent } from "@/types/calendar";
import { formatDate, getEventsForDate } from "@/utils/calendar";
import DayTimeline from "./DayTimeline";

interface DayViewProps {
    date: Date;
    events: CalendarEvent[];
    onEventPress: (event: CalendarEvent) => void;
}

export default function DayView({
    date,
    events,
    onEventPress,
}: DayViewProps) {
    const dayEvents = getEventsForDate(events, date);

    return (
        <View className="flex-1 bg-white">
            {/* day header */}
            <View className="px-4 py-4 bg-white border-b border-gray-200">
                <Text className="text-2xl font-bold text-gray-900">
                    {formatDate(date, 'full')}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                    {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled for today
                </Text>
            </View>

            <DayTimeline 
                events={dayEvents}
                onEventPress={onEventPress}
                startHour={8}
                endHour={17}
            />
        </View>
    )
}