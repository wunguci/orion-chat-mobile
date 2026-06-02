import { Avatar } from "@/components/common/Avatar";
import { API_BASE_URL } from "@/config/api";
import { CallContext } from "@/context/CallContext";
import { chatApi } from "@/services/api/chat";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColors } from "@/hooks/useThemeColors";

type InfoMode = "friend" | "suggested";

const getStringParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const value = error as {
      message?: unknown;
      error?: unknown;
    };

    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;
  }

  return fallback;
};

const getPrivacyAlert = (
  message: string,
  type: "chat" | "call",
): { title: string; body: string } => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("not accepting messages") ||
    lowerMessage.includes("message_not_allowed")
  ) {
    return {
      title: "Cannot Start Chat",
      body: "This person is not accepting messages from you right now.",
    };
  }

  if (
    lowerMessage.includes("not accepting calls") ||
    lowerMessage.includes("call_not_allowed")
  ) {
    return {
      title: "Cannot Start Call",
      body: "This person is not accepting calls from you right now.",
    };
  }

  if (
    lowerMessage.includes("turned off call notifications") ||
    lowerMessage.includes("call_notifications_disabled")
  ) {
    return {
      title: "Cannot Start Call",
      body: "This person has turned off call notifications right now.",
    };
  }

  if (
    lowerMessage.includes("blocked") ||
    lowerMessage.includes("not available")
  ) {
    return {
      title: type === "chat" ? "Cannot Start Chat" : "Cannot Start Call",
      body: "This action is unavailable because of privacy or block settings.",
    };
  }

  return {
    title: type === "chat" ? "Conversation" : "Call",
    body: message,
  };
};

export default function FriendViewScreen() {
  const router = useRouter();
  const callContext = useContext(CallContext);
  const params = useLocalSearchParams();
  const colors = useThemeColors();

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
      const alert = getPrivacyAlert(
        getErrorMessage(error, "Cannot start call"),
        "call",
      );
      Alert.alert(alert.title, alert.body);
    }
  };

  /**
   * Handle the Chat button
   *
   * Flow:
   * 1. Call POST /conversations/private to create or reuse a conversation
   * 2. Receive conversationId from server
   * 3. Navigate to /chat/[id] with conversationId
   */
  const handleChat = async () => {
    if (!profile || !currentUserId) return;

    try {
      //console.log("[FriendView] Creating conversation with:", profile.id);

      // Gọi API tạo conversation với friend
      const conversation = await chatApi.createConversation({
        receiverId: profile.id,
      });

      const conversationId = conversation.conversationId;

      if (!conversationId) {
        throw new Error(
          `No conversation ID received from server. Response: ${JSON.stringify(conversation)}`,
        );
      }

      // console.log(
      //   "[FriendView] Navigating to chat with conversationId:",
      //   conversationId,
      // );

      // Điều hướng tới chat screen với conversationId và friend info
      router.push({
        pathname: "/chat/[id]",
        params: {
          id: conversationId,
          name: profile.fullName,
          avatarUri: profile.avatarUrl || "",
        },
      });
    } catch (error) {
      const alert = getPrivacyAlert(
        getErrorMessage(error, "Cannot open chat"),
        "chat",
      );
      Alert.alert(alert.title, alert.body);
    }
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

  const visibleText = (value?: string | null) =>
    profile?.isProfileRestricted ? "****" : value || "Not updated";
  const visibleDate = (value?: string | null) =>
    profile?.isProfileRestricted ? "****" : formatDate(value);

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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {profile.coverImage ? (
            <Image
              source={{ uri: toAbsoluteUrl(profile.coverImage) }}
              className="h-32 w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-32" style={{ backgroundColor: colors.primary }} />
          )}

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
                  className="flex-1 flex-row items-center justify-center rounded-xl py-3 disabled:opacity-70"
                  style={{ backgroundColor: colors.primary }}
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
                  className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">Chat</Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <Text className="text-sm text-gray-text">
                Phone: {visibleText(profile.phoneNumber)}
              </Text>
              <Text className="mt-1 text-sm text-gray-text">
                Email: {visibleText(profile.email)}
              </Text>
              <Text className="mt-1 text-sm text-gray-text">
                Gender: {visibleText(profile.gender)}
              </Text>
              <Text className="mt-1 text-sm text-gray-text">
                Birthdate: {visibleDate(profile.birthDate)}
              </Text>
            </View>

            <View className="mb-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <Text className="text-sm text-gray-text">
                Account created on: {visibleDate(profile.createdAt)}
              </Text>
              <Text className="mt-1 text-sm text-gray-text">
                Friend since: {visibleDate(profile.friendshipSince)}
              </Text>
            </View>

            {profile.isProfileRestricted ? (
              <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <Text className="text-sm text-amber-800">
                  This user only shares profile details with their selected audience.
                </Text>
              </View>
            ) : null}

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
