import { useAuth } from "@/hooks/useAuth";
import { useWebRTC } from "@/hooks/useWebRTC";
import { callSocketService } from "../services/websocket/callSocket";
import type {
  CallAnswerData,
  CallOfferData,
  CallState,
  CallType,
  CallUser,
  IceCandidateData,
  IncomingCallData,
} from "../types/call";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

export type CallContextValue = CallState & {
  incomingCall: IncomingCallData | null;
  initiateCall: (
    conversationId: string,
    receiverId: string,
    callType: CallType,
    receiverInfo?: Partial<CallUser>,
  ) => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  endCall: () => void;
};

export const CallContext = createContext<CallContextValue | null>(null);

const INITIAL_STATE: CallState = {
  callId: null,
  conversationId: null,
  callType: "video",
  status: "idle",
  isInitiator: false,
  isCaller: false,
  localStream: null,
  remoteStream: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
  otherUser: null,
  error: null,
  startTime: null,
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { state } = useAuth();
  const [callState, setCallState] = useState<CallState>(INITIAL_STATE);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );
  const incomingAlertShownRef = useRef(false);
  const callScreenOpenedRef = useRef(false);
  const currentCallIdRef = useRef<string | null>(null);
  const currentOtherUserIdRef = useRef<string | null>(null);
  const incomingCallRef = useRef<IncomingCallData | null>(null);
  const acceptedCallIdRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<CallOfferData | null>(null);

  useEffect(() => {
    currentCallIdRef.current = callState.callId;
    currentOtherUserIdRef.current = callState.otherUser?.id || null;
  }, [callState.callId, callState.otherUser]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  const {
    initializePeerConnection,
    getLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    toggleAudio: toggleAudioTrack,
    toggleVideo: toggleVideoTrack,
    cleanup: cleanupWebRTC,
    isSupported,
  } = useWebRTC({
    onRemoteStream: (stream) => {
      setCallState((prev) => ({
        ...prev,
        remoteStream: stream,
        status: "connected",
        startTime: prev.startTime || Date.now(),
      }));
    },
    onIceCandidate: (candidate) => {
      const socket = callSocketService.getSocket();
      const callId = currentCallIdRef.current;
      const targetUserId = currentOtherUserIdRef.current;

      if (!socket || !callId || !targetUserId) {
        return;
      }

      socket.emit("call:ice-candidate", {
        callId,
        targetUserId,
        candidate,
      });
    },
    onConnectionStateChange: (connectionState) => {
      if (connectionState === "failed") {
        setCallState((prev) => ({
          ...prev,
          status: "failed",
          error: "Connection failed",
        }));
      }
    },
    onIceRestart: async (offer) => {
      const socket = callSocketService.getSocket();
      const callId = currentCallIdRef.current;
      const targetUserId = currentOtherUserIdRef.current;

      if (!socket || !callId || !targetUserId) {
        return;
      }

      socket.emit("call:offer", {
        callId,
        receiverId: targetUserId,
        offer,
      });
    },
  });

  const openCallScreen = useCallback(
    (
      conversationId: string,
      callMode: CallType,
      targetUserId: string,
      targetName?: string,
    ) => {
      if (callScreenOpenedRef.current) {
        return;
      }

      callScreenOpenedRef.current = true;
      router.push({
        pathname: "/video-call",
        params: {
          conversationId,
          callMode,
          targetUserId,
          targetName: targetName || "Friend",
        },
      });
    },
    [router],
  );

  const resetCall = useCallback(() => {
    cleanupWebRTC();
    setCallState(INITIAL_STATE);
    setIncomingCall(null);
    pendingOfferRef.current = null;
    acceptedCallIdRef.current = null;
    incomingAlertShownRef.current = false;
    callScreenOpenedRef.current = false;
  }, [cleanupWebRTC]);

  const handleUnsupportedRuntime = useCallback(
    (source: "accept" | "initiate") => {
      const message =
        "Audio/video call requires a development build. Expo Go does not include react-native-webrtc native module.";

      setCallState((prev) => ({
        ...prev,
        status: "failed",
        error: message,
      }));

      Alert.alert(
        "WebRTC Unavailable",
        source === "accept"
          ? "Cannot accept this call in Expo Go. Please use a dev build."
          : "Cannot start this call in Expo Go. Please use a dev build.",
      );
    },
    [],
  );

  useEffect(() => {
    const userId = state.user?.userId;
    if (!state.isAuthenticated || !userId) {
      callSocketService.disconnect();
      return;
    }

    const socket = callSocketService.connect(userId);

    const onIncoming = (data: IncomingCallData) => {
      // Luôn cho phép nhận thông báo khi có cuộc gọi đến.
      incomingAlertShownRef.current = false;
      setIncomingCall(data);
      setCallState((prev) => ({
        ...prev,
        callId: data.callId,
        conversationId: data.conversationId,
        callType: data.callType,
        status: "ringing",
        isInitiator: false,
        isCaller: false,
        localStream: null,
        remoteStream: null,
        isAudioEnabled: true,
        isVideoEnabled: data.callType === "video",
        startTime: null,
        error: null,
        otherUser: {
          id: data.callerId,
          name: data.callerName || "Unknown",
          avatar: data.callerAvatar,
        },
      }));
    };

    const onInitiated = async (data: { callId: string }) => {
      setCallState((prev) => ({
        ...prev,
        callId: data.callId,
        status: "calling",
      }));

      const targetUserId = currentOtherUserIdRef.current;
      const socket = callSocketService.getSocket();
      if (!socket || !targetUserId) {
        return;
      }

      try {
        const offer = await createOffer();
        socket.emit("call:offer", {
          callId: data.callId,
          receiverId: targetUserId,
          offer,
        });
      } catch (error) {
        setCallState((prev) => ({
          ...prev,
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to create offer",
        }));
      }
    };

    const onAccept = () => {
      // Signaling accepted, but mobile has no WebRTC media connection yet.
      // Keep UI in connecting state to match real call state.
      setCallState((prev) => ({
        ...prev,
        status: "calling",
        startTime: null,
      }));

      setCallState((prev) => {
        if (prev.conversationId && prev.otherUser?.id) {
          openCallScreen(
            prev.conversationId,
            prev.callType,
            prev.otherUser.id,
            prev.otherUser.name,
          );
        }
        return prev;
      });
    };

    const onOffer = async (data: CallOfferData) => {
      // Offer for active call: renegotiation/ICE restart.
      if (
        currentCallIdRef.current === data.callId &&
        !incomingCallRef.current
      ) {
        try {
          const answer = await handleOffer(data.offer);
          const socket = callSocketService.getSocket();
          if (socket) {
            socket.emit("call:answer", {
              callId: data.callId,
              callerId: data.callerId,
              answer,
            });
          }
        } catch {
          // Ignore renegotiation errors, call:error from server/UI handles fallback.
        }
        return;
      }

      pendingOfferRef.current = data;

      if (
        acceptedCallIdRef.current === data.callId &&
        incomingCallRef.current &&
        callSocketService.getSocket()
      ) {
        try {
          const answer = await handleOffer(data.offer);
          callSocketService.getSocket()?.emit("call:answer", {
            callId: data.callId,
            callerId: data.callerId,
            answer,
          });
          pendingOfferRef.current = null;
          setIncomingCall(null);
          incomingAlertShownRef.current = false;
        } catch (error) {
          setCallState((prev) => ({
            ...prev,
            status: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Failed to process offer",
          }));
        }
      }
    };

    const onAnswer = async (data: CallAnswerData) => {
      try {
        await handleAnswer(data.answer);
      } catch (error) {
        setCallState((prev) => ({
          ...prev,
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to handle answer",
        }));
      }
    };

    const onIceCandidate = async (data: IceCandidateData) => {
      try {
        await addIceCandidate(data.candidate);
      } catch {
        // Ignore individual ICE candidate failures.
      }
    };

    const onReject = () => {
      setCallState((prev) => ({ ...prev, status: "rejected" }));
      setTimeout(resetCall, 300);
    };

    const onEnded = () => {
      setCallState((prev) => ({ ...prev, status: "ended" }));
      setTimeout(resetCall, 300);
    };

    const onError = (payload: { message?: string }) => {
      setCallState((prev) => ({
        ...prev,
        status: "failed",
        error: payload?.message || "Call failed",
      }));
      setTimeout(resetCall, 500);
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:initiated", onInitiated);
    socket.on("call:accept", onAccept);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:reject", onReject);
    socket.on("call:ended", onEnded);
    socket.on("call:error", onError);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:initiated", onInitiated);
      socket.off("call:accept", onAccept);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:reject", onReject);
      socket.off("call:ended", onEnded);
      socket.off("call:error", onError);
    };
  }, [
    state.isAuthenticated,
    state.user?.userId,
    resetCall,
    openCallScreen,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
  ]);

  const initiateCall = useCallback(
    async (
      conversationId: string,
      receiverId: string,
      callType: CallType,
      receiverInfo?: Partial<CallUser>,
    ) => {
      const caller = state.user;
      const callerId = caller?.userId;

      if (!callerId) {
        throw new Error("Missing caller user id");
      }

      const socket =
        callSocketService.getSocket() || callSocketService.connect(callerId);

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
        status: "calling",
        isInitiator: true,
        isCaller: true,
        otherUser: {
          id: receiverId,
          name: receiverInfo?.name || "Friend",
          avatar: receiverInfo?.avatar,
        },
        error: null,
      }));

      initializePeerConnection();

      const stream = await getLocalStream(callType === "video", true);
      setCallState((prev) => ({
        ...prev,
        localStream: stream,
      }));

      socket.emit("call:initiate", {
        conversationId,
        receiverId,
        callType,
        callerName: caller.fullName || caller.phoneNumber,
        callerAvatar: caller.avatarUrl,
      });

      openCallScreen(conversationId, callType, receiverId, receiverInfo?.name);
    },
    [
      state.user,
      openCallScreen,
      initializePeerConnection,
      getLocalStream,
      isSupported,
      handleUnsupportedRuntime,
    ],
  );

  const acceptCall = useCallback(() => {
    const socket = callSocketService.getSocket();
    if (!socket || !incomingCall) return;

    if (!isSupported) {
      handleUnsupportedRuntime("accept");
      socket.emit("call:reject", {
        callId: incomingCall.callId,
        targetUserId: incomingCall.callerId,
      });
      setIncomingCall(null);
      incomingAlertShownRef.current = false;
      return;
    }

    acceptedCallIdRef.current = incomingCall.callId;

    try {
      initializePeerConnection();
    } catch (error) {
      setCallState((prev) => ({
        ...prev,
        status: "failed",
        error:
          error instanceof Error
            ? error.message
            : "WebRTC initialization failed",
      }));
      return;
    }

    const localSetup = async () => {
      try {
        const stream = await getLocalStream(
          incomingCall.callType === "video",
          true,
        );
        setCallState((prev) => ({
          ...prev,
          localStream: stream,
        }));

        const pendingOffer = pendingOfferRef.current;
        if (pendingOffer && pendingOffer.callId === incomingCall.callId) {
          const answer = await handleOffer(pendingOffer.offer);
          socket.emit("call:answer", {
            callId: pendingOffer.callId,
            callerId: pendingOffer.callerId,
            answer,
          });
          pendingOfferRef.current = null;
        }
      } catch (error) {
        setCallState((prev) => ({
          ...prev,
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Cannot access camera/microphone",
        }));
      }
    };

    void localSetup();

    socket.emit("call:accept", {
      callId: incomingCall.callId,
      targetUserId: incomingCall.callerId,
    });

    // Same reason as onAccept: only signaling is done here.
    setCallState((prev) => ({
      ...prev,
      status: "calling",
      startTime: null,
    }));

    openCallScreen(
      incomingCall.conversationId,
      incomingCall.callType,
      incomingCall.callerId,
      incomingCall.callerName,
    );

    setIncomingCall(null);
    incomingAlertShownRef.current = false;
  }, [
    incomingCall,
    openCallScreen,
    getLocalStream,
    handleOffer,
    initializePeerConnection,
    isSupported,
    handleUnsupportedRuntime,
  ]);

  const rejectCall = useCallback(() => {
    const socket = callSocketService.getSocket();
    if (!socket || !incomingCall) {
      resetCall();
      return;
    }

    socket.emit("call:reject", {
      callId: incomingCall.callId,
      targetUserId: incomingCall.callerId,
    });

    resetCall();
  }, [incomingCall, resetCall]);

  useEffect(() => {
    if (!incomingCall || incomingAlertShownRef.current) {
      return;
    }

    incomingAlertShownRef.current = true;

    if (!isSupported) {
      Alert.alert(
        "Incoming call",
        `${incomingCall.callerName || "Unknown"} is calling (${incomingCall.callType}). WebRTC is unavailable in Expo Go, so this call will be rejected.`,
        [
          {
            text: "OK",
            onPress: () => {
              rejectCall();
            },
          },
        ],
        { cancelable: false },
      );
      return;
    }

    Alert.alert(
      "Incoming call",
      `${incomingCall.callerName || "Unknown"} is calling (${incomingCall.callType})`,
      [
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            rejectCall();
          },
        },
        {
          text: "Accept",
          onPress: () => {
            acceptCall();
          },
        },
      ],
      { cancelable: false },
    );
  }, [incomingCall, acceptCall, rejectCall, isSupported]);

  const endCall = useCallback(() => {
    const socket = callSocketService.getSocket();
    const targetUserId = callState.otherUser?.id;

    if (socket && callState.callId && targetUserId) {
      socket.emit("call:end", {
        callId: callState.callId,
        targetUserId,
      });
    }

    resetCall();
  }, [callState.callId, callState.otherUser?.id, resetCall]);

  const toggleAudio = useCallback(() => {
    const socket = callSocketService.getSocket();
    const targetUserId = callState.otherUser?.id;
    const nextEnabled = !callState.isAudioEnabled;

    setCallState((prev) => ({
      ...prev,
      isAudioEnabled: nextEnabled,
    }));

    toggleAudioTrack(nextEnabled);

    if (socket && callState.callId && targetUserId) {
      socket.emit("call:toggle-media", {
        callId: callState.callId,
        targetUserId,
        mediaType: "audio",
        enabled: nextEnabled,
      });
    }
  }, [
    callState.callId,
    callState.isAudioEnabled,
    callState.otherUser?.id,
    toggleAudioTrack,
  ]);

  const toggleVideo = useCallback(() => {
    const socket = callSocketService.getSocket();
    const targetUserId = callState.otherUser?.id;
    const nextEnabled = !callState.isVideoEnabled;

    setCallState((prev) => ({
      ...prev,
      isVideoEnabled: nextEnabled,
    }));

    toggleVideoTrack(nextEnabled);

    if (socket && callState.callId && targetUserId) {
      socket.emit("call:toggle-media", {
        callId: callState.callId,
        targetUserId,
        mediaType: "video",
        enabled: nextEnabled,
      });
    }
  }, [
    callState.callId,
    callState.isVideoEnabled,
    callState.otherUser?.id,
    toggleVideoTrack,
  ]);

  return (
    <CallContext.Provider
      value={{
        ...callState,
        incomingCall,
        initiateCall,
        acceptCall,
        rejectCall,
        toggleAudio,
        toggleVideo,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}
