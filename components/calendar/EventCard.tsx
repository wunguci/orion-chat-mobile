import { CalendarEvent } from "@/types/calendar";
import { formatTime } from "@/utils/calendar";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface EventCardProps {
  event: CalendarEvent;
  onPress: () => void;
}

export default function EventCard({ event, onPress }: EventCardProps) {
  const backgroundColor =
    event.color === "cyan"
      ? "bg-cyan-100 dark:bg-cyan-900/30"
      : event.color === "pink"
        ? "bg-pink-100 dark:bg-pink-900/30"
        : event.color === "purple"
          ? "bg-purple-100 dark:bg-purple-900/30"
          : event.color === "blue"
            ? "bg-blue-100 dark:bg-blue-900/30"
            : "bg-green-100 dark:bg-green-900/30";

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
      activeOpacity={0.8}
      className={`rounded-lg border-l-4 ${borderColor} ${backgroundColor} p-3 mb-2`}
    >
      {/* title */}
      <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
        {event.title}
      </Text>

      {/* time */}
      <Text className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {formatTime(new Date(event.startTime))} -{" "}
        {formatTime(new Date(event.endTime))}
      </Text>

      {/* location */}
      {event.location && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={12} color="#0D9488" />
          <Text className="text-xs text-green-primary ml-1">
            {event.location}
          </Text>
        </View>
      )}

      {/* participants */}
      {event.participants && event.participants.length > 0 && (
        <View className="flex-row items-center">
          <View className="flex-row">
            {event.participants.slice(0, 3).map((p, index) => (
              <Image
                key={p.id}
                source={{ uri: p.avatar }}
                className="w-6 h-6 rounded-full border-2 border-white"
                style={{ marginLeft: index > 0 ? -8 : 0 }}
              />
            ))}
          </View>
          {event.participants.length > 3 && (
            <Text className="text-xs text-gray-500 ml-2">
              +{event.participants.length - 3} more
            </Text>
          )}
        </View>
      )}

      {/* active badge */}
      {event.isActive && (
        <View className="absolute top-2 right-2 bg-green-primary px-2 py-1 rounded-full">
          <Text className="text-xs font-semibold text-white">ACTIVE</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
