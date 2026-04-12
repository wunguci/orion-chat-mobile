import ChatListItem from "@/components/chat/ChatListItem";
import ChatSearchBar from "@/components/chat/ChatSearchBar";
import ChatTabFilter, { ChatTab } from "@/components/chat/ChatTabFilter";
import { useTheme } from "@/hooks/useTheme";
import { ChatItem } from "@/types/chat";
import React, { useMemo, useState } from "react";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_CHATS: ChatItem[] = [
  {
    id: "1",
    name: "Athena",
    lastMessage: "That's a good idea",
    time: "9:41 AM",
    unread: 0,
    isGroup: false,
    isMuted: false,
    isSentByMe: false,
    isRead: false,
    avatarUri: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "2",
    name: "Olivia Isabella",
    lastMessage: "The weather will be perfect for th...",
    time: "9:41 AM",
    unread: 0,
    isGroup: false,
    isMuted: false,
    isSentByMe: false,
    isRead: false,
    avatarUri: "https://i.pravatar.cc/150?img=35",
  },
  {
    id: "3",
    name: "Photographers",
    lastMessage: "Here're my latest drone...",
    time: "9:16 AM",
    unread: 5,
    isGroup: true,
    isMuted: false,
    isSentByMe: false,
    isRead: false,
    avatarUris: [
      "https://i.pravatar.cc/150?img=10",
      "https://i.pravatar.cc/150?img=20",
    ],
  },
  {
    id: "4",
    name: "Daryl, Ian Daniel, +1",
    lastMessage: "Store is out of stock",
    time: "Yesterday",
    unread: 0,
    isGroup: true,
    isMuted: true,
    isSentByMe: true,
    isRead: false,
    avatarUris: [
      "https://i.pravatar.cc/150?img=5",
      "https://i.pravatar.cc/150?img=15",
    ],
  },
  {
    id: "5",
    name: "SpaceX Crew-16 Launch",
    lastMessage: "I've been there!",
    time: "Thursday",
    unread: 0,
    isGroup: true,
    isMuted: false,
    isSentByMe: false,
    isRead: false,
    avatarUris: [
      "https://i.pravatar.cc/150?img=21",
      "https://i.pravatar.cc/150?img=22",
    ],
  },
  {
    id: "6",
    name: "Lela Walsh",
    lastMessage: "Next time it's my turn!",
    time: "12/01/26",
    unread: 0,
    isGroup: false,
    isMuted: false,
    isSentByMe: false,
    isRead: false,
    avatarUri: "https://i.pravatar.cc/150?img=38",
  },
  {
    id: "7",
    name: "Roland Marks",
    lastMessage: "@waldo Glad to hear 😊",
    time: "12/01/26",
    unread: 0,
    isGroup: false,
    isMuted: false,
    isSentByMe: false,
    isRead: false,
    avatarUri: "https://i.pravatar.cc/150?img=8",
  },
  {
    id: "8",
    name: "Helen Flatley",
    lastMessage: "Ok",
    time: "12/13/21",
    unread: 0,
    isGroup: false,
    isMuted: false,
    isSentByMe: true,
    isRead: true,
    avatarUri: "https://i.pravatar.cc/150?img=45",
  },
];

export default function ChatScreen() {
  const { colors, colorScheme } = useTheme();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ChatTab>("all");

  const filteredChats = useMemo(() => {
    let list = MOCK_CHATS;

    if (activeTab === "unread") {
      list = list.filter((c) => c.unread > 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q),
      );
    }

    return list;
  }, [search, activeTab]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <ChatSearchBar value={search} onChangeText={setSearch} />
      <ChatTabFilter activeTab={activeTab} onTabChange={setActiveTab} />

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatListItem item={item} />}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 0.5,
              marginLeft: 80,
              backgroundColor: colors.divider,
            }}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
