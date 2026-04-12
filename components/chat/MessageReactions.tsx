import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { MessageReaction } from "@/types/chat";

interface MessageReactionsProps {
  reactions?: MessageReaction[];
}

/**
 * Component để hiển thị emoji reactions dưới tin nhắn
 * Nhóm các reactions lại theo emoji
 */
export default function MessageReactions({
  reactions,
}: MessageReactionsProps) {
  const { colors } = useTheme();

  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Nhóm reactions theo emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      const existingEmoji = acc.find((r) => r.emoji === reaction.emoji);
      if (existingEmoji) {
        existingEmoji.count += 1;
        existingEmoji.users.push(reaction.userId);
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.userId],
        });
      }
      return acc;
    },
    [] as Array<{ emoji: string; count: number; users: string[] }>,
  );

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 6,
      }}
    >
      {groupedReactions.map((group, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 12,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Text style={{ fontSize: 14 }}>{group.emoji}</Text>
          {group.count > 1 && (
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                fontWeight: "600",
              }}
            >
              {group.count}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
