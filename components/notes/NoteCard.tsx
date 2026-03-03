import { View, Text, TouchableOpacity } from "react-native";
import { NoteListItem } from "@/types/note";
import CategoryBadge from "./CategoryBadge";

interface NoteCardProps {
  note: NoteListItem;
  onPress: (id: string) => void;
}

export default function NoteCard({ note, onPress }: NoteCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(note.id)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      activeOpacity={0.7}
    >
      {/* Header: Title + Timestamp */}
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-primary flex-1">
          {note.title}
        </Text>
        <Text className="text-xs text-gray-secondary ml-2">
          {note.timestamp}
        </Text>
      </View>

      {/* Preview Text */}
      <Text className="text-sm text-gray-text mb-3" numberOfLines={2}>
        {note.preview}
      </Text>

      {/* Category Badge */}
      <CategoryBadge category={note.category} />
    </TouchableOpacity>
  );
}
