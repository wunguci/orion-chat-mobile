import { Avatar } from "@/components/common/Avatar";
import { API_BASE_URL } from "@/config/api";
import type { FriendProfileItem } from "@/types/friend";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FriendInfoMode = "friend" | "suggested";

interface FriendInfoModalProps {
  visible: boolean;
  profile: FriendProfileItem | null;
  mode?: FriendInfoMode;
  isSendingAddFriend?: boolean;
  hasPendingRequest?: boolean;
  onClose: () => void;
  onAddFriend?: (friendId: string) => void;
  onCall?: (friendId: string) => void;
  onChat?: (friendId: string) => void;
  onBlock?: (friendId: string) => void;
  onRemove?: (friendId: string) => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Not updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated";
  return date.toLocaleDateString("en-US");
};

const toAbsoluteUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
};

export const FriendInfoModal: React.FC<FriendInfoModalProps> = ({
  visible,
  profile,
  mode = "friend",
  isSendingAddFriend = false,
  hasPendingRequest = false,
  onClose,
  onAddFriend,
  onCall,
  onChat,
  onBlock,
  onRemove,
}) => {
  if (!visible || !profile) return null;

  const coverUri = toAbsoluteUrl(profile.coverImage);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/55 px-4 py-10" onPress={onClose}>
        <Pressable
          className="my-auto max-h-[90%] overflow-hidden rounded-2xl bg-white"
          onPress={(event) => event.stopPropagation()}
        >
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              className="h-28 w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-28 bg-green-primary" />
          )}

          <TouchableOpacity
            onPress={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5"
          >
            <Ionicons name="close" size={18} color="#334155" />
          </TouchableOpacity>

          <ScrollView
            className="-mt-10"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4 self-start rounded-full border-4 border-white bg-white">
              <Avatar
                uri={profile.avatarUrl || undefined}
                name={profile.fullName}
                size="xl"
              />
            </View>

            <View className="mb-4 flex-row items-center gap-2">
              <Text className="flex-1 text-2xl font-bold text-gray-primary">
                {profile.fullName}
              </Text>
              <View
                className={`rounded-full px-2 py-1 ${
                  profile.isOnline ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    profile.isOnline ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {profile.isOnline ? "Online" : "Offline"}
                </Text>
              </View>
            </View>

            {mode === "suggested" ? (
              <View className="mb-4 flex-row gap-3">
                <TouchableOpacity
                  disabled={isSendingAddFriend || hasPendingRequest}
                  onPress={() => onAddFriend?.(profile.id)}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-green-primary py-3 disabled:opacity-70"
                >
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">
                    {hasPendingRequest
                      ? "Request sent"
                      : isSendingAddFriend
                        ? "Sending..."
                        : "Add Friend"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onChat?.(profile.id)}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-slate-700 py-3"
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">Chat</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mb-4 flex-row gap-3">
                <TouchableOpacity
                  onPress={() => onCall?.(profile.id)}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-slate-700 py-3"
                >
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onChat?.(profile.id)}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-green-primary py-3"
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">Chat</Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <Text className="text-sm text-gray-text">
                Phone: {profile.phoneNumber || "Not updated"}
              </Text>
              <Text className="mt-1 text-sm text-gray-text">
                Email: {profile.email || "Not updated"}
              </Text>
              <Text className="mt-1 text-sm text-gray-text">
                Gender: {profile.gender || "Not updated"}
              </Text>
              <Text className="mt-1 text-sm text-gray-text">
                Birthdate: {formatDate(profile.birthDate)}
              </Text>
            </View>

            <View className="mb-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <Text className="text-sm text-gray-text">
                Account created on: {formatDate(profile.createdAt)}
              </Text>
              <Text className="mt-1 text-sm text-gray-text">
                Friend since: {formatDate(profile.friendshipSince)}
              </Text>
            </View>

            {mode === "friend" && (
              <View className="mt-4 gap-2 border-t border-gray-200 pt-4">
                <TouchableOpacity
                  onPress={() => onBlock?.(profile.id)}
                  className="rounded-lg px-2 py-2"
                >
                  <Text className="font-medium text-amber-700">
                    Block messages and calls
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onRemove?.(profile.id)}
                  className="rounded-lg px-2 py-2"
                >
                  <Text className="font-medium text-red-600">
                    Remove from friends list
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
