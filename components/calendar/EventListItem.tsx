import { CalendarEvent } from "@/types/calendar";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";

interface EventListItemProps {
  event: CalendarEvent;
  onPress: () => void;
}

export default function EventListItem({ event, onPress }: EventListItemProps) {
  const startTime = new Date(event.startTime);
  const borderColor =
    event.color === "cyan"
      ? "border-teal-500"
      : event.color === "pink"
        ? "border-pink-400"
        : event.color === "purple"
          ? "border-purple-500"
          : event.color === "blue"
            ? "border-blue-500"
            : "border-green-500";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row p-4 mb-3 bg-gray-50 rounded-lg border-l-4 ${borderColor}`}
    >
      <View className="mr-4">
        <Text className="text-2xl font-bold text-gray-900">
          {startTime.getHours().toString().padStart(2, '0')} : {startTime.getMinutes().toString().padStart(2, '0')}
        </Text>
        <Text className="text-xs text-gray-500">
          {startTime.getHours() >= 12 ? 'PM' : 'AM'}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">
          {event.title}
        </Text>
        {event.location && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="location" size={14} color="#6B7280"/>
            <Text className="text-sm text-gray-600 ml-1">
              {event.location}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
