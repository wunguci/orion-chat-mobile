import { CallContext } from "@/context/CallContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

let RTCViewComponent: React.ComponentType<{
  streamURL: string;
  style?: object;
  objectFit?: "cover" | "contain";
  mirror?: boolean;
}> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RTCViewComponent = require("react-native-webrtc").RTCView;
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
    targetName?: string;
    callMode?: "audio" | "video";
  }>();
  const call = useContext(CallContext);

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

  const showLocalPreview = callMode === "video" && localStreamUrl;
  const showRemoteVideo = callMode === "video" && remoteStreamUrl;

  return (
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
            <View className="h-28 w-28 rounded-full bg-neutral-700 items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">
                {getInitials(title)}
              </Text>
            </View>
            <Text className="text-white/70 text-center">
              {callMode === "video"
                ? "Waiting for remote video..."
                : "Audio call in progress"}
            </Text>
          </View>
        )}

        {showLocalPreview ? (
          <View className="absolute right-4 top-28 h-40 w-28 rounded-xl overflow-hidden border border-white/25 bg-black">
            {RTCViewComponent ? (
              <RTCViewComponent
                streamURL={localStreamUrl}
                style={{ flex: 1 }}
                objectFit="cover"
                mirror
              />
            ) : null}
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
}
