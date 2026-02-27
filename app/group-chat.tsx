import GroupSettingsModal from "@/components/chat/GroupSettingModal";
import { navigate } from "expo-router/build/global-state/routing";
import {
  ArrowLeft,
  Heart,
  Image as ImageIcon,
  Menu,
  Mic,
  Search,
  Smile,
  Video,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Message {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  avatar: string;
  content: string;
  timestamp: string;
  reactions: { emoji: string; count: number }[];
  isCurrentUser: boolean;
  type: "text" | "link" | "image";
  linkTitle?: string;
}

export default function GroupChatScreen() {
  const [group, setGroup] = useState({
    id: 1,
    name: "Động đậy",
    members: 4,
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      userId: "1",
      userName: "Huỳnh Giang",
      userColor: "text-blue-600",
      avatar: "HG",
      content: "https://docs.google.com/spreadsheets/d/1...",
      linkTitle: "Tin nhắn của Huỳnh Giang",
      timestamp: "",
      reactions: [],
      isCurrentUser: false,
      type: "link",
    },
    {
      id: "2",
      userId: "2",
      userName: "Thu hồi",
      userColor: "text-blue-600",
      avatar: "TH",
      content: "gì mà dữ v",
      timestamp: "23:00",
      reactions: [{ emoji: "😊", count: 1 }],
      isCurrentUser: false,
      type: "text",
    },
    {
      id: "3",
      userId: "3",
      userName: "You",
      userColor: "text-gray-700",
      avatar: "Y",
      content: "phải đúng có show hip ơi",
      timestamp: "",
      reactions: [],
      isCurrentUser: true,
      type: "text",
    },
    {
      id: "4",
      userId: "3",
      userName: "You",
      userColor: "text-gray-700",
      avatar: "Y",
      content: "áp lực x2",
      timestamp: "23:02",
      reactions: [{ emoji: "😊", count: 1 }],
      isCurrentUser: true,
      type: "text",
    },
    {
      id: "5",
      userId: "2",
      userName: "Thu hồi",
      userColor: "text-blue-600",
      avatar: "TH",
      content: "công ty có 90 người",
      timestamp: "23:02",
      reactions: [],
      isCurrentUser: false,
      type: "text",
    },
    {
      id: "6",
      userId: "2",
      userName: "Thu hồi",
      userColor: "text-blue-600",
      avatar: "TH",
      content: "mà 82 clone",
      timestamp: "23:02",
      reactions: [],
      isCurrentUser: false,
      type: "text",
    },
    {
      id: "7",
      userId: "4",
      userName: "Phan Phước Hiệp",
      userColor: "text-orange-primary",
      avatar: "PP",
      content: "hay là github nó quét mới có nhiều lượt z:)",
      timestamp: "",
      reactions: [],
      isCurrentUser: false,
      type: "text",
    },
    {
      id: "8",
      userId: "4",
      userName: "Phan Phước Hiệp",
      userColor: "text-orange-primary",
      avatar: "PP",
      content: "chứ thấy Visitors nó để có 3 người là xem à",
      timestamp: "23:05",
      reactions: [],
      isCurrentUser: false,
      type: "text",
    },
    {
      id: "9",
      userId: "3",
      userName: "You",
      userColor: "text-gray-700",
      avatar: "Y",
      content: "cái prj của mình",
      timestamp: "",
      reactions: [],
      isCurrentUser: true,
      type: "text",
    },
    {
      id: "10",
      userId: "3",
      userName: "You",
      userColor: "text-gray-700",
      avatar: "Y",
      content: "có 7 clone à",
      timestamp: "23:08",
      reactions: [{ emoji: "😊", count: 1 }],
      isCurrentUser: true,
      type: "text",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const renderMessage = (message: Message) => {
    if (message.type === "link") {
      return (
        <View key={message.id} className="mb-3 flex-row items-start px-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-xs font-bold text-blue-600">
              {message.avatar}
            </Text>
          </View>
          <View className="ml-2 flex-1 flex-col gap-1 items-start">
            {!message.isCurrentUser && (
              <Text
                className={`ml-3 text-xs font-semibold text-orange-primary`}
              >
                {message.userName}
              </Text>
            )}
            <TouchableOpacity className="flex-row items-center gap-2 rounded-lg border-2 border-gray-border bg-white p-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-blue-600">
                  {message.content}
                </Text>
                <Text className="mt-1 text-xs text-gray-secondary">
                  {message.linkTitle}
                </Text>
              </View>
              <TouchableOpacity>
                <Text className="text-lg">⌄</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        className={`mb-3 flex-row px-4 ${
          message.isCurrentUser ? "justify-end" : "justify-start"
        }`}
      >
        {!message.isCurrentUser && (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-xs font-bold text-blue-600">
              {message.avatar}
            </Text>
          </View>
        )}

        <View
          className={`flex-1 flex-col gap-1 ${
            message.isCurrentUser ? "items-end mr-2" : "items-start ml-2"
          }`}
        >
          {!message.isCurrentUser && (
            <Text className={`ml-3 text-xs font-semibold text-orange-primary`}>
              {message.userName}
            </Text>
          )}

          <View
            className={`max-w-xs rounded-2xl px-4 py-2 ${
              message.isCurrentUser
                ? "border-2 border-blue-400 bg-blue-50"
                : "border-2 border-gray-border bg-white"
            }`}
          >
            <Text className="text-sm text-gray-primary">{message.content}</Text>
          </View>

          <View
            className={`flex-row items-center gap-2 ${
              message.isCurrentUser ? "mr-3" : "ml-3"
            }`}
          >
            {message.timestamp && (
              <Text className="text-xs text-gray-secondary">
                {message.timestamp}
              </Text>
            )}
            {message.reactions.map((reaction, idx) => (
              <TouchableOpacity
                key={idx}
                className="flex-row items-center gap-1 rounded-full border border-gray-border bg-white px-2 py-1"
              >
                <Text className="text-sm">{reaction.emoji}</Text>
                <Text className="text-xs text-gray-secondary">
                  {reaction.count}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity>
              <Heart size={14} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        {message.isCurrentUser && (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-xs font-bold text-blue-600">
              {message.avatar}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <GroupSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        groupName="Động đậy"
        groupMembers={4}
      />
      <SafeAreaView className="flex-1 bg-orange-bg-light">
        {/* Header */}
        <View className="flex-row items-center justify-between bg-orange-primary px-4 py-3">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => navigate("/(tabs)")}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-lg font-bold text-white">{group.name}</Text>
              <Text className="text-xs text-white opacity-80">
                {group.members} thành viên
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity>
              <Video size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Search size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Menu size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          renderItem={({ item }) => renderMessage(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <View className="border-t border-gray-border bg-white px-4 py-3">
          <View className="flex-row items-center gap-2 rounded-full bg-gray-border px-4 py-2">
            <TouchableOpacity>
              <Smile size={20} color="#cbd5e1" />
            </TouchableOpacity>
            <TextInput
              placeholder="Tin nhắn"
              placeholderTextColor="#cbd5e1"
              value={inputText}
              onChangeText={setInputText}
              className="flex-1 text-sm text-gray-primary"
            />
            <TouchableOpacity>
              <Mic size={20} color="#cbd5e1" />
            </TouchableOpacity>
            <TouchableOpacity>
              <ImageIcon size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
