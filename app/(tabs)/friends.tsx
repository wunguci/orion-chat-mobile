import { SectionHeader } from "@/components/common/SectionHeader";
import { FriendRequestItem } from "@/components/friends/FriendRequestItem";
import { RecentlyActiveItem } from "@/components/friends/RecentlyActiveItem";
import { SuggestedFriendItem } from "@/components/friends/SuggestedFriendItem";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Friends() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - Pending Requests
  const pendingRequests = [
    {
      id: "1",
      name: "Con Zangg",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      mutualFriends: "Mutual friend with Sarah J.",
    },
    {
      id: "2",
      name: "Con Nhonn",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      mutualCount: 4,
    },
  ];

  // Mock data - Suggested Friends
  const suggestedFriends = [
    {
      id: "3",
      name: "Daniel Kim",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      jobTitle: "Software Engineer at TechFlow",
    },
    {
      id: "4",
      name: "Elena Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      jobTitle: "Product Designer",
    },
    {
      id: "5",
      name: "James Wilson",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      jobTitle: "Creative Director",
    },
  ];

  // Mock data - Recently Active
  const recentlyActive = [
    {
      id: "6",
      name: "Alex R.",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      timeAgo: "5m ago",
      status: "online" as const,
    },
    {
      id: "7",
      name: "Maya T.",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      timeAgo: "12m ago",
      status: "online" as const,
    },
    {
      id: "8",
      name: "Daniel K.",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      timeAgo: "1h ago",
      status: "online" as const,
    },
    {
      id: "9",
      name: "Elena R.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      timeAgo: "2h ago",
      status: "online" as const,
    },
  ];

  const handleAccept = (id: string) => {
    console.log("Accepted friend request with id:", id);
  };

  const handleDecline = (id: string) => {
    console.log("Declined friend request with id:", id);
  };

  const handleAddFriend = (id: string) => {
    console.log("Add friend with id:", id);
  };

  const handleRecentlyActivePress = (id: string) => {
    console.log("View profile of:", id);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header  */}
      <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-12 flex-row items-center justify-between">
        {/* <TouchableOpacity onPress={() => router.back()} >
            <Ionicons name="arrow-back" size={24} color="#505050" />
          </TouchableOpacity> */}
        <Text className="text-2xl font-bold text-gray-primary">Friends</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#505050" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Search bar  */}
        <View className="px-4 py-3">
          <View className="flex-row items-center bg-gray-light rounded-xl px-4 py-1">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Search friends or requests"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-base"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Pending requests  */}
        <SectionHeader
          title="Pending Requests"
          badge={pendingRequests.length}
        />
        {pendingRequests.map((request) => (
          <FriendRequestItem
            key={request.id}
            request={request}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ))}

        {/* Suggested for you  */}
        <SectionHeader
          title="Suggested for you"
          actionText="See all"
          onActionPress={() => console.log("See all")}
        />
        {suggestedFriends.map((friend) => (
          <SuggestedFriendItem
            key={friend.id}
            friend={friend}
            onAdd={handleAddFriend}
          />
        ))}

        {/* Recently Active */}
        <SectionHeader title="Recently Active" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-2 py-2"
        >
          {recentlyActive.map((friend) => (
            <RecentlyActiveItem
              key={friend.id}
              friend={friend}
              onPress={handleRecentlyActivePress}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}
