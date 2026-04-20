import { GroupCallContext } from "@/context/GroupCallContext";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getInitials = (name?: string) => {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");
};

export default function IncomingGroupCallModal() {
  const call = useContext(GroupCallContext);
  const { state } = useAuth();
  const currentUserId = state.user?.userId;

  const incomingCall = call?.incomingCall;
  const participants = useMemo(() => {
    if (!incomingCall?.participants) return [];

    return incomingCall.participants.filter(
      (participant) => participant.id !== currentUserId,
    );
  }, [incomingCall?.participants, currentUserId]);

  if (!call || !incomingCall) {
    return null;
  }

  const previewParticipants = participants.slice(0, 3);
  const overflowCount = Math.max(participants.length - previewParticipants.length, 0);
  const displayCount =
    incomingCall.participantCount || participants.length + 1;

  return (
    <Modal visible animationType="slide" transparent={false}>
      <SafeAreaView className="flex-1 bg-black">
        <View className="absolute -top-20 -left-10 h-56 w-56 rounded-full bg-emerald-500/10" />
        <View className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-cyan-500/10" />

        <View className="flex-1 px-6 py-8">
          <View className="items-center">
            <View className="h-16 w-16 rounded-full bg-emerald-500/20 items-center justify-center">
              <Ionicons
                name={incomingCall.callType === "video" ? "videocam" : "call"}
                size={28}
                color="#34d399"
              />
            </View>
            <Text className="text-white text-2xl font-semibold mt-5">
              Group {incomingCall.callType === "video" ? "Video" : "Audio"} Call
            </Text>
            <Text className="text-white/70 text-sm mt-2">
              {incomingCall.initiatorName || "Someone"} is calling
            </Text>
            <Text className="text-white/50 text-xs mt-3">
              {displayCount} participants
            </Text>
          </View>

          <View className="mt-8">
            <Text className="text-white/70 text-sm mb-4">Joining with</Text>
            <View className="flex-row flex-wrap">
              {previewParticipants.map((participant) => (
                <View
                  key={participant.id}
                  className="flex-row items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 mr-3 mb-3"
                >
                  <View className="h-8 w-8 rounded-full bg-emerald-500/15 items-center justify-center mr-2">
                    <Text className="text-emerald-100 text-xs font-semibold">
                      {getInitials(participant.name)}
                    </Text>
                  </View>
                  <Text className="text-white text-xs">
                    {participant.name}
                  </Text>
                </View>
              ))}
              {overflowCount > 0 ? (
                <View className="flex-row items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 mr-3 mb-3">
                  <Text className="text-white text-xs">+{overflowCount} more</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="mt-auto">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={call.rejectGroupCall}
                className="flex-1 h-14 rounded-full bg-red-600 items-center justify-center mr-3"
              >
                <Text className="text-white font-semibold">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void call.acceptGroupCall()}
                className="flex-1 h-14 rounded-full bg-emerald-500 items-center justify-center ml-3"
              >
                <Text className="text-white font-semibold">Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
