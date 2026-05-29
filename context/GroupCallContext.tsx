import { useAuth } from "@/hooks/useAuth";
import { useGroupCall } from "@/hooks/useGroupCall";
import { useStreamVideoRuntime } from "@/context/StreamVideoContext";
import { callSocketService } from "@/services/websocket/callSocket";
import { chatSocketService } from "@/services/websocket/chatSocket";
import type {
  CallType,
  GroupCallAnswerData,
  GroupCallIceCandidateData,
  GroupCallOfferData,
  GroupCallParticipant,
  GroupCallState,
  GroupIncomingCallData,
  GroupParticipantJoinedData,
  GroupParticipantLeftData,
} from "@/types/call";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import type { MediaStream } from "@stream-io/react-native-webrtc";

export type GroupCallContextValue = GroupCallState & {
  incomingCall: GroupIncomingCallData | null;
  initiateGroupCall: (
    conversationId: string,
    participantIds: string[],
    callType: CallType,
    participantNames?: Record<string, string>,
    participantAvatars?: Record<string, string>,
  ) => Promise<void>;
  joinGroupCall: (
    callId: string,
    conversationId: string,
    explicitCallType?: CallType,
  ) => Promise<void>;
  acceptGroupCall: () => Promise<void>;
  rejectGroupCall: () => void;
  leaveGroupCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleAudioForParticipant: (userId: string, enabled: boolean) => void;
  toggleVideoForParticipant: (userId: string, enabled: boolean) => void;
  setActiveParticipant: (userId: string) => void;
};

export const GroupCallContext = createContext<GroupCallContextValue | null>(
  null,
);

const INITIAL_STATE: GroupCallState = {
  callId: null,
  conversationId: null,
  callType: "video",
  callMode: "group",
  status: "idle",
  isInitiator: false,
  isCaller: false,
  isHost: false,
  localStream: null,
  participants: [],
  isVideoEnabled: true,
  isAudioEnabled: true,
  error: null,
  startTime: null,
};

export function GroupCallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { state } = useAuth();
  const streamVideoRuntime = useStreamVideoRuntime();
  const streamVideoEnabled =
    streamVideoRuntime.sdkAvailable && streamVideoRuntime.clientReady;
  const [callState, setCallState] = useState<GroupCallState>(INITIAL_STATE);
  const [incomingCall, setIncomingCall] = useState<GroupIncomingCallData | null>(
    null,
  );

  const currentCallIdRef = useRef<string | null>(null);
  const callScreenOpenedRef = useRef(false);
  const incomingCallRef = useRef<GroupIncomingCallData | null>(null);
  const failedStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const incomingAlertShownRef = useRef(false);

  const userId = state.user?.userId;
  const userName =
    state.user?.fullName || state.user?.phoneNumber || "User";

  const {
    getLocalStream,
    createPeerForParticipant,
    createOfferForParticipant,
    handleOfferFromParticipant,
    handleAnswerFromParticipant,
    addIceCandidateForParticipant,
    toggleAudioForParticipant: toggleAudioForPeer,
    toggleVideoForParticipant: toggleVideoForPeer,
    toggleMediaForAll,
    removeParticipant,
    cleanup: cleanupGroupCall,
    getAllParticipantIds,
    isSupported,
  } = useGroupCall({
    onParticipantStream: (participantId, stream) => {
      setCallState((prev) => {
        const exists = prev.participants.some((p) => p.id === participantId);
        const incomingInfo = incomingCallRef.current?.participants?.find(
          (p) => p.id === participantId,
        );
        const fallbackName = incomingInfo?.name || "User";
        const fallbackAvatar = (incomingInfo as any)?.avatar || "";

        const nextParticipants = exists
          ? prev.participants.map((p) =>
              p.id === participantId ? { ...p, stream } : p,
            )
          : [
              ...prev.participants,
              {
                id: participantId,
                name: fallbackName,
                avatar: fallbackAvatar,
                isVideoEnabled: true,
                isAudioEnabled: true,
                stream,
              },
            ];

        return {
          ...prev,
          participants: nextParticipants,
          status: "connected",
          startTime: prev.startTime || Date.now(),
        };
      });
    },
    onParticipantLeft: (participantId) => {
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.id !== participantId),
      }));
    },
    onIceCandidate: (targetUserId, candidate) => {
      const socket = callSocketService.getSocket();
      const callId = currentCallIdRef.current;
      if (!socket || !callId) return;

      socket.emit("groupcall:ice-candidate", {
        callId,
        targetUserId,
        candidate,
      });
    },
    onConnectionStateChange: (participantId, stateValue) => {
      if (stateValue === "failed" || stateValue === "disconnected") {
        setCallState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participantId ? { ...p, isSpeaking: false } : p,
          ),
        }));
      }
    },
  });

  const statusRef = useRef<string>("idle");
  const isLocalUserCallingRef = useRef<boolean>(false);
  useEffect(() => {
    statusRef.current = callState.status;
  }, [callState.status]);

  useEffect(() => {
    currentCallIdRef.current = callState.callId;
  }, [callState.callId]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  const resetCall = useCallback(() => {
    isLocalUserCallingRef.current = false;
    if (failedStateTimerRef.current) {
      clearTimeout(failedStateTimerRef.current);
      failedStateTimerRef.current = null;
    }

    cleanupGroupCall();
    setCallState(INITIAL_STATE);
    setIncomingCall(null);
    callScreenOpenedRef.current = false;
    incomingAlertShownRef.current = false;
  }, [cleanupGroupCall]);

  const handleUnsupportedRuntime = useCallback(
    (source: "accept" | "initiate") => {
      const message =
        "Audio/video group call requires a development build. Expo Go does not include react-native-webrtc native module.";

      setCallState((prev) => ({
        ...prev,
        status: "failed",
        error: message,
      }));

      Alert.alert(
        "WebRTC Unavailable",
        source === "accept"
          ? "Cannot accept this group call in Expo Go. Please use a dev build."
          : "Cannot start this group call in Expo Go. Please use a dev build.",
      );
    },
    [],
  );

  const openGroupCallScreen = useCallback(
    (conversationId: string, callType: CallType) => {
      if (callScreenOpenedRef.current) {
        return;
      }

      callScreenOpenedRef.current = true;
      router.push({
        pathname: "/group-call",
        params: {
          conversationId,
          callType,
        },
      });
    },
    [router],
  );

  const joinGroupCall = useCallback(
    async (
      callId: string,
      conversationId: string,
      explicitCallType?: CallType,
    ) => {
      isLocalUserCallingRef.current = true;
      if (!userId) return;

      const socket = callSocketService.getSocket();
      if (!socket) return;

      const callData = (incomingCallRef.current ?? incomingCall) ?? {
        callType: explicitCallType || "video",
        participants: [],
      };

      if (!streamVideoEnabled && !isSupported) {
        handleUnsupportedRuntime("accept");
        setIncomingCall(null);
        return;
      }

      currentCallIdRef.current = callId;

      const initialParticipants = (callData.participants || [])
        .filter((participant) => participant.id !== userId)
        .map((participant) => ({
          id: participant.id,
          name: participant.name,
          avatar: (participant as any).avatar || "",
          isVideoEnabled: true,
          isAudioEnabled: true,
          isHost: participant.isHost,
        }));

      setCallState((prev) => ({
        ...prev,
        callId,
        conversationId,
        callType: callData.callType || prev.callType,
        callMode: "group",
        status: "calling",
        isInitiator: false,
        isCaller: false,
        isHost: false,
        participants: initialParticipants,
        isVideoEnabled: callData.callType === "video",
        isAudioEnabled: true,
        error: null,
      }));

      if (!streamVideoEnabled) {
        let stream: MediaStream | null = null;
        try {
          // ALWAYS try to get both audio and video tracks to support camera toggle during audio calls
          stream = await getLocalStream(true, true);
          if (callData.callType !== "video") {
            stream.getVideoTracks().forEach((track) => {
              track.enabled = false;
            });
          }
        } catch (error) {
          try {
            stream = await getLocalStream(false, true);
          } catch (audioError) {
            setCallState((prev) => ({
              ...prev,
              error:
                audioError instanceof Error
                  ? audioError.message
                  : "Cannot access microphone",
            }));
          }
        }

        if (stream) {
          setCallState((prev) => ({
            ...prev,
            localStream: stream,
          }));
        }
      }

      socket.emit("groupcall:join", {
        callId,
        conversationId,
        userId,
        userName,
        userAvatar: state.user?.avatarUrl,
      });

      if (!streamVideoEnabled) {
        for (const participant of initialParticipants) {
          try {
            await createPeerForParticipant(participant.id, participant.name, false);
          } catch {
            // Ignore individual peer creation failures
          }
        }
      }

      setIncomingCall(null);
      openGroupCallScreen(conversationId, callData.callType);
    },
    [
      userId,
      incomingCall,
      isSupported,
      streamVideoEnabled,
      handleUnsupportedRuntime,
      getLocalStream,
      createPeerForParticipant,
      openGroupCallScreen,
      userName,
    ],
  );

  const acceptGroupCall = useCallback(async () => {
    if (!incomingCall) return;
    await joinGroupCall(incomingCall.callId, incomingCall.conversationId);
  }, [incomingCall, joinGroupCall]);

  const rejectGroupCall = useCallback(() => {
    const socket = callSocketService.getSocket();
    if (socket && incomingCall) {
      socket.emit("groupcall:reject", {
        callId: incomingCall.callId,
        userId,
      });
    }

    setIncomingCall(null);
  }, [incomingCall, userId]);

  useEffect(() => {
    if (!incomingCall || incomingAlertShownRef.current) {
      return;
    }

    incomingAlertShownRef.current = true;

    if (!isSupported) {
      Alert.alert(
        "Incoming Group Call",
        `${incomingCall.initiatorName || incomingCall.callerName || "Someone"} is inviting you to a group call (${incomingCall.callType}). WebRTC is unavailable in Expo Go, so this call will be rejected.`,
        [
          {
            text: "OK",
            onPress: () => {
              rejectGroupCall();
            },
          },
        ],
        { cancelable: false },
      );
      return;
    }

    Alert.alert(
      "Incoming Group Call",
      `${incomingCall.initiatorName || incomingCall.callerName || "Someone"} is inviting you to a group call (${incomingCall.callType})`,
      [
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            rejectGroupCall();
          },
        },
        {
          text: "Accept",
          onPress: () => {
            void acceptGroupCall();
          },
        },
      ],
      { cancelable: false },
    );
  }, [incomingCall, acceptGroupCall, rejectGroupCall, isSupported]);

  useEffect(() => {
    if (!state.isAuthenticated || !userId) {
      callSocketService.disconnect();
      return;
    }

    const socket = callSocketService.connect(userId, state.token || undefined);

    const onIncoming = (data: GroupIncomingCallData) => {
      if (
        data.initiatorId === userId ||
        data.initiatorId === state.user?.userId ||
        currentCallIdRef.current ||
        statusRef.current !== "idle" ||
        isLocalUserCallingRef.current
      ) {
        return;
      }
      setIncomingCall(data);
      setCallState((prev) => ({
        ...prev,
        callId: data.callId,
        conversationId: data.conversationId,
        callType: data.callType,
        callMode: "group",
        status: "ringing",
        isInitiator: false,
        isCaller: false,
        isHost: false,
        localStream: null,
        participants: (data.participants || [])
          .filter((participant) => participant.id !== userId)
          .map((participant) => ({
            id: participant.id,
            name: participant.name,
            avatar: participant.avatar || "",
            isVideoEnabled: true,
            isAudioEnabled: true,
            isHost: participant.isHost,
          })),
        isVideoEnabled: data.callType === "video",
        isAudioEnabled: true,
        error: null,
        startTime: null,
      }));
    };

    const onParticipantJoined = async (data: GroupParticipantJoinedData) => {
      if (data.callId !== currentCallIdRef.current) return;
      if (data.userId === userId) return;

      const participantName =
        data.userName ||
        data.participants?.find((p) => p.id === data.userId)?.name ||
        "User";

      if (streamVideoEnabled) {
        setCallState((prev) => {
          const exists = prev.participants.some((p) => p.id === data.userId);
          if (exists) {
            return {
              ...prev,
              participants: prev.participants.map((p) =>
                p.id === data.userId
                  ? {
                      ...p,
                      name: participantName,
                      avatar: data.userAvatar || p.avatar,
                      isHost: data.isHost !== undefined ? data.isHost : p.isHost,
                    }
                  : p
              ),
            };
          }

          return {
            ...prev,
            participants: [
              ...prev.participants,
              {
                id: data.userId,
                name: participantName,
                avatar: data.userAvatar,
                isVideoEnabled: true,
                isAudioEnabled: true,
                isHost: data.isHost,
              },
            ],
          };
        });
        return;
      }

      try {
        if (!getAllParticipantIds().includes(data.userId)) {
          await createPeerForParticipant(data.userId, participantName, false);
        }

        const offer = await createOfferForParticipant(data.userId);
        if (offer) {
          socket.emit("groupcall:offer", {
            callId: data.callId,
            targetUserId: data.userId,
            offer,
          });
        }
      } catch {
        // Ignore individual peer creation failures
      }

      setCallState((prev) => {
        const exists = prev.participants.some((p) => p.id === data.userId);
        if (exists) {
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.id === data.userId
                ? {
                    ...p,
                    name: participantName,
                    avatar: data.userAvatar || p.avatar,
                    isHost: data.isHost !== undefined ? data.isHost : p.isHost,
                  }
                : p
            ),
          };
        }

        const nextParticipant: GroupCallParticipant = {
          id: data.userId,
          name: participantName,
          avatar: data.userAvatar,
          isVideoEnabled: true,
          isAudioEnabled: true,
          isHost: data.isHost,
        };

        return {
          ...prev,
          participants: [...prev.participants, nextParticipant],
        };
      });
    };

    const onParticipantLeft = (data: GroupParticipantLeftData) => {
      if (data.callId !== currentCallIdRef.current) return;

      removeParticipant(data.userId);
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.id !== data.userId),
      }));
    };

    const onOffer = async (data: GroupCallOfferData) => {
      if (data.callId !== currentCallIdRef.current) return;
      if (streamVideoEnabled) return;
      try {
        if (!getAllParticipantIds().includes(data.callerId)) {
          await createPeerForParticipant(data.callerId, "User", false);
        }

        const answer = await handleOfferFromParticipant(
          data.callerId,
          data.offer,
        );

        if (answer) {
          socket.emit("groupcall:answer", {
            callId: data.callId,
            responderId: userId,
            targetUserId: data.callerId,
            answer,
          });
        }
      } catch {
        // Ignore offer handling errors
      }
    };

    const onAnswer = async (data: GroupCallAnswerData) => {
      try {
        await handleAnswerFromParticipant(data.responderId, data.answer);
      } catch {
        // Ignore answer handling errors
      }
    };

    const onIceCandidate = async (data: GroupCallIceCandidateData) => {
      try {
        await addIceCandidateForParticipant(data.fromUserId, data.candidate);
      } catch {
        // Ignore individual ICE failures
      }
    };

    const onMediaToggled = (data: {
      callId: string;
      userId: string;
      mediaType: "audio" | "video";
      enabled: boolean;
    }) => {
      if (data.callId !== currentCallIdRef.current) return;
      if (data.userId === userId) return;

      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) => {
          if (p.id !== data.userId) return p;

          if (data.mediaType === "audio") {
            return { ...p, isAudioEnabled: data.enabled };
          }

          return { ...p, isVideoEnabled: data.enabled };
        }),
      }));
    };

    const onEnded = () => {
      setCallState((prev) => ({ ...prev, status: "ended" }));
      setTimeout(resetCall, 300);
    };

    const onError = (payload: { message?: string }) => {
      setCallState((prev) => ({
        ...prev,
        status: "failed",
        error: payload?.message || "Group call failed",
      }));
      setTimeout(resetCall, 500);
    };

    socket.on("groupcall:incoming", onIncoming);
    socket.on("groupcall:participant-joined", onParticipantJoined);
    socket.on("groupcall:participant-left", onParticipantLeft);
    socket.on("groupcall:offer", onOffer);
    socket.on("groupcall:answer", onAnswer);
    socket.on("groupcall:ice-candidate", onIceCandidate);
    socket.on("groupcall:media-toggled", onMediaToggled);
    socket.on("groupcall:ended", onEnded);
    socket.on("groupcall:error", onError);

    return () => {
      socket.off("groupcall:incoming", onIncoming);
      socket.off("groupcall:participant-joined", onParticipantJoined);
      socket.off("groupcall:participant-left", onParticipantLeft);
      socket.off("groupcall:offer", onOffer);
      socket.off("groupcall:answer", onAnswer);
      socket.off("groupcall:ice-candidate", onIceCandidate);
      socket.off("groupcall:media-toggled", onMediaToggled);
      socket.off("groupcall:ended", onEnded);
      socket.off("groupcall:error", onError);
    };
  }, [
    state.isAuthenticated,
    userId,
    getAllParticipantIds,
    createPeerForParticipant,
    createOfferForParticipant,
    handleOfferFromParticipant,
    handleAnswerFromParticipant,
    addIceCandidateForParticipant,
    removeParticipant,
    resetCall,
    streamVideoEnabled,
  ]);

  const initiateGroupCall = useCallback(
    async (
      conversationId: string,
      participantIds: string[],
      callType: CallType,
      participantNames?: Record<string, string>,
      participantAvatars?: Record<string, string>,
    ) => {
      isLocalUserCallingRef.current = true;
      if (!userId) {
        throw new Error("Missing caller user id");
      }

      const socket =
        callSocketService.getSocket() || callSocketService.connect(userId, state.token || undefined);

      if (!socket) {
        throw new Error("Call socket is not connected");
      }

      if (!streamVideoEnabled && !isSupported) {
        handleUnsupportedRuntime("initiate");
        return;
      }

      setCallState((prev) => ({
        ...prev,
        conversationId,
        callType,
        callMode: "group",
        status: "calling",
        isInitiator: true,
        isCaller: true,
        isHost: true,
        isVideoEnabled: callType === "video",
        isAudioEnabled: true,
        error: null,
      }));

      if (!streamVideoEnabled) {
        let stream: MediaStream | null = null;
        try {
          // ALWAYS try to get both audio and video tracks to support camera toggle during audio calls
          stream = await getLocalStream(true, true);
          if (callType !== "video") {
            stream.getVideoTracks().forEach((track) => {
              track.enabled = false;
            });
          }
        } catch (error) {
          try {
            stream = await getLocalStream(false, true);
          } catch (audioError) {
            setCallState((prev) => ({
              ...prev,
              error:
                audioError instanceof Error
                  ? audioError.message
                  : "Cannot access microphone",
            }));
          }
        }

        if (stream) {
          setCallState((prev) => ({
            ...prev,
            localStream: stream,
          }));
        }
      }

      openGroupCallScreen(conversationId, callType);

      return new Promise<void>((resolve, reject) => {
        const currentSocket = callSocketService.getSocket();
        if (!currentSocket) {
          reject(new Error("Socket not initialized"));
          return;
        }
        const handleInitiated = async (data: {
          callId: string;
          participants: {
            id: string;
            name: string;
            avatar?: string;
            isHost: boolean;
          }[];
        }) => {
          clearTimeout(timeout);
          currentCallIdRef.current = data.callId;

          const remoteParticipants = data.participants.filter(
            (participant) => participant.id !== userId,
          );

          setCallState((prev) => ({
            ...prev,
            callId: data.callId,
            participants: remoteParticipants.map((participant) => ({
              id: participant.id,
              name: participant.name,
              avatar: participant.avatar,
              isVideoEnabled: true,
              isAudioEnabled: true,
              isHost: participant.isHost,
            })),
          }));

          // Send active group call message
          chatSocketService.sendCallMessage({
            conversationId,
            callType,
            callStatus: "active",
            duration: 0,
            callId: data.callId,
            clientMessageId: `group_call_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            onAck: () => {
              console.log("[GroupCallContext] Call message created successfully on mobile");
            },
          });

          if (!streamVideoEnabled) {
            for (const participant of remoteParticipants) {
              try {
                await createPeerForParticipant(
                  participant.id,
                  participant.name,
                  true,
                );
              } catch {
                // Ignore individual peer creation failures
              }
            }
          }

          resolve();
        };

        const timeout = setTimeout(() => {
          currentSocket.off("groupcall:initiated", handleInitiated);
          reject(new Error("Group call initiation timeout"));
        }, 15000);

        currentSocket.once("groupcall:initiated", handleInitiated);
        currentSocket.emit("groupcall:initiate", {
          conversationId,
          participantIds: participantIds.filter((id) => id !== userId),
          participantNames: participantNames || {},
          participantAvatars: participantAvatars || {},
          callType,
          initiatorName: userName,
          initiatorAvatar: state.user?.avatarUrl,
        });
      });
    },
    [
      userId,
      isSupported,
      streamVideoEnabled,
      handleUnsupportedRuntime,
      getLocalStream,
      openGroupCallScreen,
      createPeerForParticipant,
      userName,
    ],
  );



  const leaveGroupCall = useCallback(() => {
    const socket = callSocketService.getSocket();
    if (!socket || !callState.callId) {
      resetCall();
      return;
    }

    if (callState.isHost) {
      socket.emit("groupcall:end", { callId: callState.callId });
    } else {
      socket.emit("groupcall:leave", { callId: callState.callId });
    }

    resetCall();
  }, [callState.callId, callState.isHost, resetCall]);

  const toggleAudio = useCallback(() => {
    const nextEnabled = !callState.isAudioEnabled;
    toggleMediaForAll("audio", nextEnabled);

    callState.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });

    setCallState((prev) => {
      let updatedStream = prev.localStream;
      if (prev.localStream) {
        let MediaStreamCtor: any = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          MediaStreamCtor = require("@stream-io/react-native-webrtc").MediaStream;
        } catch {
          MediaStreamCtor = null;
        }
        if (MediaStreamCtor) {
          updatedStream = new MediaStreamCtor(prev.localStream.getTracks());
        }
      }
      return {
        ...prev,
        isAudioEnabled: nextEnabled,
        localStream: updatedStream,
      };
    });

    const socket = callSocketService.getSocket();
    if (socket && callState.callId) {
      socket.emit("groupcall:toggle-media", {
        callId: callState.callId,
        userId,
        mediaType: "audio",
        enabled: nextEnabled,
      });
    }
  }, [
    callState.isAudioEnabled,
    callState.callId,
    callState.localStream,
    toggleMediaForAll,
    userId,
  ]);

  const toggleVideo = useCallback(() => {
    const nextEnabled = !callState.isVideoEnabled;
    toggleMediaForAll("video", nextEnabled);

    callState.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });

    setCallState((prev) => {
      let updatedStream = prev.localStream;
      if (prev.localStream) {
        let MediaStreamCtor: any = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          MediaStreamCtor = require("@stream-io/react-native-webrtc").MediaStream;
        } catch {
          MediaStreamCtor = null;
        }
        if (MediaStreamCtor) {
          updatedStream = new MediaStreamCtor(prev.localStream.getTracks());
        }
      }
      return {
        ...prev,
        isVideoEnabled: nextEnabled,
        localStream: updatedStream,
      };
    });

    const socket = callSocketService.getSocket();
    if (socket && callState.callId) {
      socket.emit("groupcall:toggle-media", {
        callId: callState.callId,
        userId,
        mediaType: "video",
        enabled: nextEnabled,
      });
    }
  }, [
    callState.isVideoEnabled,
    callState.callId,
    callState.localStream,
    toggleMediaForAll,
    userId,
  ]);

  const toggleAudioForParticipant = useCallback(
    (participantId: string, enabled: boolean) => {
      toggleAudioForPeer(participantId, enabled);
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participantId ? { ...p, isAudioEnabled: enabled } : p,
        ),
      }));
    },
    [toggleAudioForPeer],
  );

  const toggleVideoForParticipant = useCallback(
    (participantId: string, enabled: boolean) => {
      toggleVideoForPeer(participantId, enabled);
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participantId ? { ...p, isVideoEnabled: enabled } : p,
        ),
      }));
    },
    [toggleVideoForPeer],
  );

  const setActiveParticipant = useCallback((participantId: string) => {
    setCallState((prev) => ({
      ...prev,
      activeParticipantId: participantId,
    }));
  }, []);

  const value: GroupCallContextValue = {
    ...callState,
    incomingCall,
    initiateGroupCall,
    joinGroupCall,
    acceptGroupCall,
    rejectGroupCall,
    leaveGroupCall,
    toggleAudio,
    toggleVideo,
    toggleAudioForParticipant,
    toggleVideoForParticipant,
    setActiveParticipant,
  };

  return (
    <GroupCallContext.Provider value={value}>
      {children}
    </GroupCallContext.Provider>
  );
}
