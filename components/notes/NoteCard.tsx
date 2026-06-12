import { View, Text, TouchableOpacity } from "react-native";
import { NoteListItem } from "@/types/note";
import CategoryBadge from "./CategoryBadge";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";

interface NoteCardProps {
  note: NoteListItem;
  onPress: (noteId: string) => void;
}

export default function NoteCard({ note, onPress }: NoteCardProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={() => onPress(note.noteId)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      activeOpacity={0.7}
    >
      {/* Header: Title + Timestamp */}
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-primary flex-1 mr-2">
          {note.title}
        </Text>
        <View className="flex-row items-center">
          {note.isPinned && (
            <Ionicons name="bookmark" size={14} color={colors.primary} />
          )}
          <Text className="text-xs text-gray-secondary ml-2">
            {note.timestamp}
          </Text>
        </View>
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
