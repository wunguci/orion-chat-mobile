import { CallContext } from "@/context/CallContext";
import StreamCallView from "@/components/call/StreamCallView";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo } from "react";
import { Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

let RTCViewComponent: React.ComponentType<{
  streamURL: string;
  style?: object;
  objectFit?: "cover" | "contain";
  mirror?: boolean;
}> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RTCViewComponent = require("@stream-io/react-native-webrtc").RTCView;
} catch {
  RTCViewComponent = null;
}

const statusText: Record<string, string> = {
  idle: "Idle",
  calling: "Calling...",
  ringing: "Ringing...",
  connected: "Connected",
  ended: "Call ended",
  rejected: "Call rejected",
  failed: "Call failed",
};

function getInitials(name?: string) {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");
}

export default function VideoCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId?: string;
    targetName?: string;
    targetUserId?: string;
    callMode?: "audio" | "video";
  }>();
  const call = useContext(CallContext);
  const { state } = useAuth();

  useEffect(() => {
    if (!call) {
      return;
    }

    if (["idle", "ended", "rejected", "failed"].includes(call.status)) {
      const timer = setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [call, call?.status, router]);

  const title = call?.otherUser?.name || params.targetName || "Friend";
  const callMode = call?.callType || params.callMode || "video";

  const remoteStreamUrl = useMemo(
    () => call?.remoteStream?.toURL() || null,
    [call?.remoteStream],
  );
  const localStreamUrl = useMemo(
    () => call?.localStream?.toURL() || null,
    [call?.localStream],
  );

  if (!call) {
    return null;
  }

  const showLocalPreview = callMode === "video" && Boolean(call?.localStream);
  const showRemoteVideo =
    callMode === "video" &&
    remoteStreamUrl &&
    call.isRemoteVideoEnabled !== false;
  const conversationId = call.conversationId || params.conversationId;
  const currentUserId = state.user?.userId;
  const targetUserId = call.otherUser?.id || params.targetUserId;
  const memberIds = [currentUserId, targetUserId].filter(Boolean) as string[];

  const fallbackContent = (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        <View className="absolute top-6 left-0 right-0 z-20 items-center px-6">
          <Text className="text-white text-2xl font-semibold">{title}</Text>
          <Text className="text-white/80 mt-1 text-sm">
            {statusText[call.status] || call.status}
          </Text>
          {call.error ? (
            <Text className="text-red-300 mt-2 text-xs text-center">
              {call.error}
            </Text>
          ) : null}
        </View>

        {showRemoteVideo ? (
          RTCViewComponent ? (
            <RTCViewComponent
              streamURL={remoteStreamUrl}
              style={{ flex: 1 }}
              objectFit="cover"
              mirror={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-white/80 text-center">
                WebRTC native module unavailable in Expo Go.
              </Text>
              <Text className="text-white/60 text-center mt-2 text-xs">
                Build a dev client to use audio/video call.
              </Text>
            </View>
          )
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            {RTCViewComponent && remoteStreamUrl ? (
              <RTCViewComponent
                streamURL={remoteStreamUrl}
                style={{ width: 1, height: 1, opacity: 0 }}
                objectFit="contain"
                mirror={false}
              />
            ) : null}
            {call?.otherUser?.avatar ? (
              <Image
                source={{ uri: call.otherUser.avatar }}
                style={{ width: 112, height: 112, borderRadius: 56 }}
                className="mb-4"
              />
            ) : (
              <View className="h-28 w-28 rounded-full bg-neutral-700 items-center justify-center mb-4">
                <Text className="text-white text-3xl font-bold">
                  {getInitials(title)}
                </Text>
              </View>
            )}
            <Text className="text-white/70 text-center">
              {callMode === "video"
                ? remoteStreamUrl
                  ? "Camera off"
                  : "Waiting for remote video..."
                : "Audio call in progress"}
            </Text>
          </View>
        )}

        {showLocalPreview ? (
          <View className="absolute right-4 top-28 h-40 w-28 rounded-xl overflow-hidden border border-white/25 bg-black">
            {RTCViewComponent && localStreamUrl && call.isVideoEnabled ? (
              <RTCViewComponent
                streamURL={localStreamUrl}
                style={{ flex: 1 }}
                objectFit="cover"
                mirror
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-neutral-900">
                <Ionicons
                  name="videocam-off"
                  size={24}
                  color="#9ca3af"
                />
                <Text className="text-gray-400 text-[10px] mt-1">Camera off</Text>
              </View>
            )}
          </View>
        ) : null}

        {callMode === "audio" &&
        call.status === "connected" &&
        call.incomingVideoUpgradeRequest ? (
          <View className="absolute top-24 left-4 right-4 rounded-xl border border-white/20 bg-black/70 px-4 py-3">
            <Text className="text-white text-sm mb-3 text-center">
              {title} wants to switch to video call
            </Text>
            <View className="flex-row justify-center">
              <TouchableOpacity
                onPress={() => {
                  void call.respondVideoUpgradeRequest(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 mx-2"
              >
                <Text className="text-white text-sm font-medium">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  void call.respondVideoUpgradeRequest(true);
                }}
                className="px-4 py-2 rounded-lg bg-green-600 mx-2"
              >
                <Text className="text-white text-sm font-medium">Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View className="absolute bottom-10 left-0 right-0 px-6">
          <View className="flex-row items-center justify-center">
            <TouchableOpacity
              onPress={call.toggleAudio}
              className={`h-14 w-14 rounded-full items-center justify-center mx-3 ${
                call.isAudioEnabled ? "bg-neutral-700" : "bg-amber-600"
              }`}
            >
              <Ionicons
                name={call.isAudioEnabled ? "mic" : "mic-off"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            {callMode === "video" ? (
              <TouchableOpacity
                onPress={call.toggleVideo}
                className={`h-14 w-14 rounded-full items-center justify-center mx-3 ${
                  call.isVideoEnabled ? "bg-neutral-700" : "bg-amber-600"
                }`}
              >
                <Ionicons
                  name={call.isVideoEnabled ? "videocam" : "videocam-off"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            ) : call.status === "connected" ? (
              <TouchableOpacity
                onPress={call.requestVideoUpgrade}
                disabled={Boolean(call.isRequestingVideoUpgrade)}
                className={`h-14 w-14 rounded-full items-center justify-center mx-3 ${
                  call.isRequestingVideoUpgrade
                    ? "bg-indigo-900"
                    : "bg-indigo-600"
                }`}
              >
                <Ionicons name="videocam" size={24} color="#fff" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={call.endCall}
              className="h-14 w-14 rounded-full bg-red-600 items-center justify-center mx-3"
            >
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <StreamCallView
      conversationId={conversationId}
      callLabel={`Starting call with ${title}...`}
      mode="direct"
      memberIds={memberIds}
      custom={{
        signalingCallId: call.callId,
        callType: callMode,
      }}
      onLeave={call.endCall}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        }
      }}
      fallback={fallbackContent}
    />
  );
}
