import { Avatar } from "@/components/common/Avatar";
import { CallContext } from "@/context/CallContext";
import { friendApi } from "@/services/api/friend";
import type { CallType } from "@/types/call";
import type { FriendProfileItem } from "@/types/friend";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type InfoMode = "friend" | "suggested";

const getStringParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const formatDate = (value?: string | null) => {
  if (!value) return "Not updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated";
  return date.toLocaleDateString("vi-VN");
};

export default function FriendViewScreen() {
  const router = useRouter();
  const callContext = useContext(CallContext);
  const params = useLocalSearchParams();

  const targetUserId = getStringParam(params.userId) || "";
  const mode = (getStringParam(params.mode) as InfoMode) || "friend";
  const fallbackName = getStringParam(params.name) || "Friend";
  const fallbackAvatar = getStringParam(params.avatar) || undefined;
  const fallbackIsOnline = getStringParam(params.isOnline) === "1";
  const initialPending = getStringParam(params.pending) === "1";

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<FriendProfileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSendingAddFriend, setIsSendingAddFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(initialPending);

  useEffect(() => {
    const bootstrap = async () => {
      const candidates = [
        await AsyncStorage.getItem("auth_user"),
        await AsyncStorage.getItem("user"),
        await AsyncStorage.getItem("current_user"),
      ].filter(Boolean) as string[];

      for (const raw of candidates) {
        try {
          const parsed = JSON.parse(raw);
          const id = parsed?.id || parsed?.userId;
          if (id) {
            setCurrentUserId(String(id));
            return;
          }
        } catch {
          continue;
        }
      }

      const fallbackId = await AsyncStorage.getItem("userId");
      if (fallbackId) {
        setCurrentUserId(fallbackId);
      }
    };

    void bootstrap();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;

    setLoading(true);
    try {
      const data = await friendApi.getFriendProfile(
        currentUserId,
        targetUserId,
      );
      setProfile(data);
    } catch {
      setProfile({
        id: targetUserId,
        fullName: fallbackName,
        avatarUrl: fallbackAvatar || null,
        isOnline: fallbackIsOnline,
        phoneNumber: "",
        email: null,
        gender: null,
        birthDate: null,
        createdAt: undefined,
        friendshipSince: undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentUserId,
    fallbackAvatar,
    fallbackIsOnline,
    fallbackName,
    targetUserId,
  ]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const buildDirectConversationId = (userA: string, userB: string) => {
    const [first, second] = [userA, userB].sort();
    return `direct:${first}:${second}`;
  };

  const handleCall = async (callType: CallType) => {
    if (!callContext || !currentUserId || !profile) return;

    // if (!profile.isOnline) {
    //   Alert.alert("Call", "User is offline.");
    //   return;
    // }

    // if (callContext.status !== "idle") {
    //   Alert.alert("Call", "You are already in another call.");
    //   return;
    // }

    try {
      const conversationId = buildDirectConversationId(
        currentUserId,
        profile.id,
      );
      await callContext.initiateCall(conversationId, profile.id, callType, {
        name: profile.fullName,
        avatar: profile.avatarUrl || undefined,
      });
    } catch (error) {
      Alert.alert(
        "Call",
        error instanceof Error ? error.message : "Cannot start call",
      );
    }
  };

  const handleChat = () => {
    if (!profile) return;
    Alert.alert(
      "Chat",
      `Chat with ${profile.fullName} will be supported in next step.`,
    );
  };

  const handleAddFriend = async () => {
    if (!currentUserId || !profile || hasPendingRequest || isSendingAddFriend)
      return;

    setIsSendingAddFriend(true);
    try {
      await friendApi.sendFriendRequest(currentUserId, profile.id);
      setHasPendingRequest(true);
    } catch (error) {
      Alert.alert(
        "Add friend",
        error instanceof Error ? error.message : "Cannot send friend request",
      );
    } finally {
      setIsSendingAddFriend(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!currentUserId || !profile) return;

    Alert.alert(
      "Delete Friend",
      "Are you sure you want to remove this friend from your friend list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await friendApi.removeFriend(currentUserId, profile.id);
              router.back();
            } catch (error) {
              Alert.alert(
                "Delete friend",
                error instanceof Error ? error.message : "Cannot remove friend",
              );
            }
          },
        },
      ],
    );
  };

  const handleBlockFriend = async () => {
    if (!currentUserId || !profile) return;

    Alert.alert("Block Friend", "Are you sure you want to block this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await friendApi.blockFriend(currentUserId, profile.id);
            router.back();
          } catch (error) {
            Alert.alert(
              "Block user",
              error instanceof Error ? error.message : "Cannot block user",
            );
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="chevron-back" size={20} color="#334155" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-primary">
          Friend Info
        </Text>
        <View className="h-9 w-9" />
      </View>

      {loading || !profile ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00B14F" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="h-32 bg-green-primary" />

          <View className="-mt-12 px-4">
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
                  onPress={() => void handleAddFriend()}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-green-primary py-3 disabled:opacity-70"
                >
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">
                    {hasPendingRequest
                      ? "Da gui loi moi"
                      : isSendingAddFriend
                        ? "Sending..."
                        : "Add Friend"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChat}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-slate-700 py-3"
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">Chat</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mb-4 flex-row gap-3">
                <TouchableOpacity
                  onPress={() => void handleCall("audio")}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-slate-700 py-3"
                >
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChat}
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
                  onPress={() => void handleBlockFriend()}
                  className="rounded-lg px-2 py-2"
                >
                  <Text className="font-medium text-amber-700">
                    Block messages and calls
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void handleRemoveFriend()}
                  className="rounded-lg px-2 py-2"
                >
                  <Text className="font-medium text-red-600">
                    Remove from friends list
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
