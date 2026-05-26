import { CalendarEvent } from "@/types/calendar";
import { formatTime } from "@/utils/calendar";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface EventCardProps {
  event: CalendarEvent;
  onPress: () => void;
  compact?: boolean;
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

const toRgba = (hex: string, alpha: number) => {
  const safeHex = hex.replace("#", "");
  const six =
    safeHex.length === 3
      ? safeHex
          .split("")
          .map((ch) => `${ch}${ch}`)
          .join("")
      : safeHex;
  const value = Number.parseInt(six, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function EventCard({
  event,
  onPress,
  compact = false,
}: EventCardProps) {
  const eventColor = resolveEventColor(event.color);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`rounded-lg border-l-4 mb-2 ${compact ? "p-2" : "p-3"}`}
      style={{
        borderLeftColor: eventColor,
        backgroundColor: toRgba(eventColor, 0.16),
      }}
    >
      {/* title */}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className={`font-semibold text-gray-900 dark:text-white mb-1 ${compact ? "text-xs" : "text-sm"}`}
      >
        {event.title}
      </Text>

      {/* time */}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className={`text-gray-600 dark:text-gray-400 mb-2 ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
      </Text>

      {/* location */}
      {!compact && event.location && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={12} color="#0D9488" />
          <Text className="text-xs text-green-primary ml-1">
            {event.location}
          </Text>
        </View>
      )}

      {/* participants */}
      {!compact && event.participants && event.participants.length > 0 && (
        <View className="flex-row items-center">
          <View className="flex-row">
            {event.participants.slice(0, 3).map((p, index) => (
              <Image
                key={p.id}
                source={{
                  uri:
                    p.avatar || "https://picsum.photos/seed/default-avatar/64",
                }}
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
    </TouchableOpacity>
  );
}
