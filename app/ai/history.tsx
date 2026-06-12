import { ConversationItem } from "@/components/ai/ConversationItem";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  loadConversations,
  setCurrentConversation,
} from "@/store/slices/aiSlice";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "recent" | "archived";

export default function AIHistoryScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<TabType>("recent");
  const { conversations } = useAppSelector((state) => state.ai);

  useEffect(() => {
    dispatch(loadConversations());
  }, [dispatch]);

  const filteredConversations = conversations.filter((conv: any) =>
    activeTab === "recent"
      ? conv.status === "active"
      : conv.status === "archived",
  );

  const handleConversationPress = (conversationId: string) => {
    dispatch(setCurrentConversation(conversationId));
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 bg-white"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "#E5E5EA",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-black">History</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("recent")}
          className="flex-1 py-3"
          style={{
            borderBottomWidth: activeTab === "recent" ? 2 : 0,
            borderBottomColor: "#00B48D",
          }}
        >
          <Text
            className={`text-center font-medium ${
              activeTab === "recent" ? "text-teal-500" : "text-gray-600"
            }`}
          >
            Recent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("archived")}
          className="flex-1 py-3"
          style={{
            borderBottomWidth: activeTab === "archived" ? 2 : 0,
            borderBottomColor: "#00B48D",
          }}
        >
          <Text
            className={`text-center font-medium ${
              activeTab === "archived" ? "text-teal-500" : "text-gray-600"
            }`}
          >
            Archived
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => handleConversationPress(item.id)}
          />
        )}
        ItemSeparatorComponent={() => (
          <View className="h-px bg-gray-200" style={{ marginLeft: 76 }} />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="time-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-center mt-4">
              {activeTab === "recent"
                ? "No recent conversations"
                : "No archived conversations"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
