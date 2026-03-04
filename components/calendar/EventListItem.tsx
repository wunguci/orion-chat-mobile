import { CalendarEvent } from "@/types/calendar";
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
        <Text className="text-xs text-gray">

        </Text>
      </View>
    </TouchableOpacity>
  );
}
