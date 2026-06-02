import { GroupCallContext } from "@/context/GroupCallContext";
import StreamCallView from "@/components/call/StreamCallView";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo } from "react";
import {
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Image,
} from "react-native";
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

const getInitials = (name?: string) => {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");
};

const getColumnCount = (count: number) => {
  if (count <= 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 3;
};

export default function GroupCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId?: string;
    callType?: "audio" | "video";
  }>();
  const call = useContext(GroupCallContext);
  const { state } = useAuth();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!call) return;

    if (["idle", "ended", "rejected", "failed"].includes(call.status)) {
      const timer = setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [call, call?.status, router]);

  const callMode = call?.callType || params.callType || "video";
  const tiles = useMemo(() => {
    if (!call) {
      return [];
    }

    const seenIds = new Set<string>();
    const localUserId = state.user?.userId;
    if (localUserId) {
      seenIds.add(localUserId);
    }

    const list = [
      {
        id: "local",
        name: "You",
        avatar: state.user?.avatarUrl || "",
        stream: call.localStream,
        isVideoEnabled: call.isVideoEnabled,
        isAudioEnabled: call.isAudioEnabled,
        isHost: call.isHost,
        isLocal: true,
      }
    ];

    (call.participants || []).forEach((participant) => {
      if (participant.id && participant.id !== localUserId && !seenIds.has(participant.id)) {
        seenIds.add(participant.id);
        list.push({
          id: participant.id,
          name: participant.name,
          avatar: participant.avatar || "",
          stream: participant.stream || null,
          isVideoEnabled: participant.isVideoEnabled,
          isAudioEnabled: participant.isAudioEnabled,
          isHost: !!participant.isHost,
          isLocal: false,
        });
      }
    });

    return list;
  }, [call, state.user?.userId, state.user?.avatarUrl]);

  if (!call) {
    return null;
  }

  const columnCount = getColumnCount(tiles.length);
  const padding = 16;
  const gap = 12;
  const tileWidth =
    (width - padding * 2 - gap * (columnCount - 1)) / columnCount;
  const tileHeight = tileWidth * 1.2;
  const conversationId = call.conversationId || params.conversationId;
  const currentUserId = state.user?.userId;
  const memberIds = [
    currentUserId,
    ...call.participants.map((participant) => participant.id),
  ].filter(Boolean) as string[];

  const fallbackContent = (
    <SafeAreaView className="flex-1 bg-black">
      <View className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-emerald-500/10" />
      <View className="absolute bottom-0 -right-20 h-72 w-72 rounded-full bg-cyan-500/10" />

      <View className="flex-1 px-4">
        <View className="items-center pt-4">
          <Text className="text-white text-xl font-semibold">
            Group {callMode === "video" ? "Video" : "Audio"} Call
          </Text>
          <Text className="text-white/70 text-sm mt-1">
            {statusText[call.status] || call.status} - {tiles.length} members
          </Text>
          {call.error ? (
            <Text className="text-red-300 text-xs mt-2 text-center">
              {call.error}
            </Text>
          ) : null}
        </View>

        <View className="flex-1 pt-6">
          <View className="flex-row flex-wrap">
            {tiles.map((tile, index) => {
              const columnIndex = index % columnCount;
              const streamUrl = tile.stream?.toURL?.() || "";
              const showVideo = Boolean(streamUrl) && tile.isVideoEnabled;
              const isActive = call.activeParticipantId === tile.id;

              return (
                <TouchableOpacity
                  key={tile.id}
                  onPress={() => call.setActiveParticipant(tile.id)}
                  activeOpacity={0.85}
                  style={{
                    width: tileWidth,
                    height: tileHeight,
                    marginBottom: gap,
                    marginRight: columnIndex === columnCount - 1 ? 0 : gap,
                  }}
                  className={`overflow-hidden rounded-2xl border ${
                    isActive ? "border-emerald-400" : "border-white/10"
                  } bg-neutral-900`}
                >
                  {showVideo ? (
                    RTCViewComponent ? (
                      <RTCViewComponent
                        streamURL={streamUrl}
                        style={{ flex: 1 }}
                        objectFit="cover"
                        mirror={tile.isLocal}
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center px-4">
                        <Text className="text-white/70 text-xs text-center">
                          WebRTC module unavailable in Expo Go.
                        </Text>
                      </View>
                    )
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      {RTCViewComponent && streamUrl ? (
                        <RTCViewComponent
                          streamURL={streamUrl}
                          style={{ width: 1, height: 1, opacity: 0 }}
                          objectFit="contain"
                          mirror={false}
                        />
                      ) : null}
                      {tile.avatar ? (
                        <Image
                          source={{ uri: tile.avatar }}
                          style={{ width: 56, height: 56, borderRadius: 28 }}
                        />
                      ) : (
                        <View className="h-14 w-14 rounded-full bg-emerald-500/15 items-center justify-center">
                          <Text className="text-emerald-200 text-base font-semibold">
                            {getInitials(tile.name)}
                          </Text>
                        </View>
                      )}
                      <Text className="text-white/70 text-xs mt-2">
                        {tile.isVideoEnabled ? "Waiting for video" : "Camera off"}
                      </Text>
                    </View>
                  )}

                  <View className="absolute bottom-2 left-2 right-2 flex-row items-center justify-between">
                    <View className="flex-row items-center rounded-full bg-black/60 px-2 py-1">
                      <Text className="text-white text-xs font-medium">
                        {tile.name}
                      </Text>
                      {tile.isHost ? (
                        <Text className="text-emerald-300 text-[10px] ml-2">
                          Host
                        </Text>
                      ) : null}
                    </View>
                    <View className="h-7 w-7 rounded-full bg-black/60 items-center justify-center">
                      <Ionicons
                        name={tile.isAudioEnabled ? "mic" : "mic-off"}
                        size={14}
                        color={tile.isAudioEnabled ? "#a7f3d0" : "#fca5a5"}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="pb-10">
          <View className="flex-row items-center justify-center">
            <TouchableOpacity
              onPress={call.toggleAudio}
              className={`h-14 w-14 rounded-full items-center justify-center mx-3 ${
                call.isAudioEnabled ? "bg-neutral-800" : "bg-amber-600"
              }`}
            >
              <Ionicons
                name={call.isAudioEnabled ? "mic" : "mic-off"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={call.toggleVideo}
              className={`h-14 w-14 rounded-full items-center justify-center mx-3 ${
                call.isVideoEnabled ? "bg-neutral-800" : "bg-amber-600"
              }`}
            >
              <Ionicons
                name={call.isVideoEnabled ? "videocam" : "videocam-off"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={call.leaveGroupCall}
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
      callLabel="Starting group call..."
      mode="group"
      memberIds={memberIds}
      custom={{
        signalingCallId: call.callId,
        callType: callMode,
      }}
      onLeave={call.leaveGroupCall}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        }
      }}
      fallback={fallbackContent}
    />
  );
}
