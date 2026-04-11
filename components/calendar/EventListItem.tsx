import { CalendarEvent } from "@/types/calendar";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";

interface EventListItemProps {
  event: CalendarEvent;
  onPress: () => void;
}

const namedColorToHex: Record<string, string> = {
  cyan: "#06b6d4",
  pink: "#ec4899",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  green: "#10b981",
  orange: "#f97316",
};

const resolveEventColor = (color?: string) => {
  if (!color) return "#06b6d4";
  const normalized = color.trim().toLowerCase();
  if (normalized.startsWith("#")) return normalized;
  return namedColorToHex[normalized] || "#06b6d4";
};

export default function EventListItem({ event, onPress }: EventListItemProps) {
  const startTime = new Date(event.start);
  const eventColor = resolveEventColor(event.color);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row p-4 mb-3 bg-gray-50 rounded-lg border-l-4"
      style={{ borderLeftColor: eventColor }}
    >
      <View className="mr-4">
        <Text className="text-2xl font-bold text-gray-900">
          {startTime.getHours().toString().padStart(2, "0")} :{" "}
          {startTime.getMinutes().toString().padStart(2, "0")}
        </Text>
        <Text className="text-xs text-gray-500">
          {startTime.getHours() >= 12 ? "PM" : "AM"}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">
          {event.title}
        </Text>
        {event.location && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">{event.location}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
