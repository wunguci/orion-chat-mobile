import { CalendarEvent } from "@/types/calendar";
import { TouchableOpacity } from "react-native";

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

  return <TouchableOpacity></TouchableOpacity>;
}
