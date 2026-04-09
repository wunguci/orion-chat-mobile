import type { NoteCategory } from "@/types/note";
import { Text, View } from "react-native";

interface CategoryBadgeProps {
  category: NoteCategory;
}

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const fullHex =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : sanitized;

  const value = parseInt(fullHex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = category?.color || "#64748b";

  return (
    <View
      className="rounded px-3 py-1"
      style={{ backgroundColor: hexToRgba(color, 0.16) }}
    >
      <Text className="text-xs font-semibold uppercase" style={{ color }}>
        {category?.name || "UNCATEGORIZED"}
      </Text>
    </View>
  );
}
