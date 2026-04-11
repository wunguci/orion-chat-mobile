import type { FriendCategory } from "@/types/friend";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  activeCategory: FriendCategory;
  counts: {
    friends: number;
    requests: number;
    groups: number;
    groupInvites: number;
    blocked: number;
  };
  onChange: (category: FriendCategory) => void;
}

export const FriendCategoryTabs: React.FC<Props> = ({
  activeCategory,
  counts,
  onChange,
}) => {
  const tabs: { key: FriendCategory; label: string; count: number }[] = [
    { key: "friends", label: "Friends", count: counts.friends },
    { key: "requests", label: "Requests", count: counts.requests },
    { key: "groups", label: "Groups", count: counts.groups },
    {
      key: "group_invites",
      label: "Group Invites",
      count: counts.groupInvites,
    },
    {
      key: "blocked",
      label: "Blocked",
      count: counts.blocked,
    },
  ];

  return (
    <View className="px-4 pb-3 flex-row flex-wrap gap-2">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onChange(tab.key)}
          className={`rounded-lg px-3 py-2 ${
            activeCategory === tab.key ? "bg-green-primary" : "bg-gray-light"
          }`}
        >
          <Text
            className={`font-semibold ${
              activeCategory === tab.key ? "text-white" : "text-gray-primary"
            }`}
          >
            {tab.label} ({tab.count})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
