import { useAuth } from "@/hooks/useAuth";
import { useGroupCall } from "@/hooks/useGroupCall";
import { callSocketService } from "@/services/websocket/callSocket";
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

export type GroupCallContextValue = GroupCallState & {
  incomingCall: GroupIncomingCallData | null;
  initiateGroupCall: (
    conversationId: string,
    participantIds: string[],
    callType: CallType,
    participantNames?: Record<string, string>,
  ) => Promise<void>;
  joinGroupCall: (callId: string, conversationId: string) => Promise<void>;
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
        const nextParticipants = exists
          ? prev.participants.map((p) =>
              p.id === participantId ? { ...p, stream } : p,
            )
          : [
              ...prev.participants,
              {
                id: participantId,
                name: "User",
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

  useEffect(() => {
    currentCallIdRef.current = callState.callId;
  }, [callState.callId]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  const resetCall = useCallback(() => {
    if (failedStateTimerRef.current) {
      clearTimeout(failedStateTimerRef.current);
      failedStateTimerRef.current = null;
    }

    cleanupGroupCall();
    setCallState(INITIAL_STATE);
    setIncomingCall(null);
    callScreenOpenedRef.current = false;
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

  useEffect(() => {
    if (!state.isAuthenticated || !userId) {
      callSocketService.disconnect();
      return;
    }

    const socket = callSocketService.connect(userId);

    const onIncoming = (data: GroupIncomingCallData) => {
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

      if (!getAllParticipantIds().includes(data.userId)) {
        try {
          await createPeerForParticipant(data.userId, participantName, false);
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
      }

      setCallState((prev) => {
        if (prev.participants.some((p) => p.id === data.userId)) {
          return prev;
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
  ]);

  const initiateGroupCall = useCallback(
    async (
      conversationId: string,
      participantIds: string[],
      callType: CallType,
      participantNames?: Record<string, string>,
    ) => {
      if (!userId) {
        throw new Error("Missing caller user id");
      }

      const socket =
        callSocketService.getSocket() || callSocketService.connect(userId);

      if (!socket) {
        throw new Error("Call socket is not connected");
      }

      if (!isSupported) {
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

      const stream = await getLocalStream(callType === "video", true);
      setCallState((prev) => ({
        ...prev,
        localStream: stream,
      }));

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

          resolve();
        };

        const timeout = setTimeout(() => {
          currentSocket.off("groupcall:initiated", handleInitiated);
          reject(new Error("Group call initiation timeout"));
        }, 15000);

        currentSocket.once("groupcall:initiated", handleInitiated);
        currentSocket.emit("groupcall:initiate", {
          conversationId,
          participantIds,
          participantNames: participantNames || {},
          callType,
          initiatorName: userName,
        });
      });
    },
    [
      userId,
      isSupported,
      handleUnsupportedRuntime,
      getLocalStream,
      openGroupCallScreen,
      createPeerForParticipant,
      userName,
    ],
  );

  const joinGroupCall = useCallback(
    async (callId: string, conversationId: string) => {
      if (!incomingCallRef.current || !userId) return;

      const socket = callSocketService.getSocket();
      if (!socket) return;

      if (!isSupported) {
        handleUnsupportedRuntime("accept");
        setIncomingCall(null);
        return;
      }

      currentCallIdRef.current = callId;

      const callType = incomingCallRef.current.callType;
      const initialParticipants = (incomingCallRef.current.participants || [])
        .filter((participant) => participant.id !== userId)
        .map((participant) => ({
          id: participant.id,
          name: participant.name,
          isVideoEnabled: true,
          isAudioEnabled: true,
          isHost: participant.isHost,
        }));

      setCallState((prev) => ({
        ...prev,
        callId,
        conversationId,
        callType: callType || prev.callType,
        callMode: "group",
        status: "calling",
        isInitiator: false,
        isCaller: false,
        isHost: false,
        participants: initialParticipants,
        isVideoEnabled:
          callType === "video" || prev.isVideoEnabled,
        isAudioEnabled: true,
        error: null,
      }));

      const stream = await getLocalStream(callType === "video", true);

      setCallState((prev) => ({
        ...prev,
        localStream: stream,
      }));

      socket.emit("groupcall:join", {
        callId,
        conversationId,
        userId,
        userName,
      });

      for (const participant of initialParticipants) {
        try {
          await createPeerForParticipant(participant.id, participant.name, false);
        } catch {
          // Ignore individual peer creation failures
        }
      }

      setIncomingCall(null);
      openGroupCallScreen(conversationId, callType);
    },
    [
      userId,
      isSupported,
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

    setCallState((prev) => ({
      ...prev,
      isAudioEnabled: nextEnabled,
    }));

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

    setCallState((prev) => ({
      ...prev,
      isVideoEnabled: nextEnabled,
    }));

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
