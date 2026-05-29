import { useCallback, useEffect, useRef } from "react";
import type {
  MediaStream,
  MediaStreamTrack,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "@stream-io/react-native-webrtc";
import { getIceConfiguration } from "@/config/webrtcIce";
import { GroupCallPeerManager } from "../services/groupCallPeerManager";

type WebRTCModule = {
  mediaDevices: {
    getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  };
  MediaStream: new (tracks?: MediaStreamTrack[]) => MediaStream;
  RTCPeerConnection: new (
    configuration?: RTCConfiguration,
  ) => RTCPeerConnection;
  RTCIceCandidate: new (
    candidateInitDict?: RTCIceCandidateInit,
  ) => RTCIceCandidate;
  RTCSessionDescription: new (
    descriptionInitDict?: RTCSessionDescriptionInit,
  ) => RTCSessionDescription;
};

let webRTCModule: WebRTCModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  webRTCModule = require("@stream-io/react-native-webrtc") as WebRTCModule;
} catch {
  webRTCModule = null;
}

const ensureWebRTCModule = (): WebRTCModule => {
  if (!webRTCModule) {
    throw new Error(
      "WebRTC native module is unavailable in this runtime. Use a development build (expo prebuild + run:android/run:ios) instead of Expo Go.",
    );
  }

  return webRTCModule;
};

interface UseGroupCallProps {
  onParticipantStream: (userId: string, stream: MediaStream) => void;
  onParticipantLeft: (userId: string) => void;
  onIceCandidate?: (userId: string, candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (userId: string, state: RTCPeerConnectionState) => void;
}

export const useGroupCall = ({
  onParticipantStream,
  onParticipantLeft,
  onIceCandidate,
  onConnectionStateChange,
}: UseGroupCallProps) => {
  const peerManagerRef = useRef<GroupCallPeerManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidatesRef = useRef<
    Map<string, RTCIceCandidateInit[]>
  >(new Map());

  const flushPendingIceCandidates = useCallback(async (userId: string) => {
    const peerConnection = peerManagerRef.current?.getPeerConnection(userId);
    if (!peerConnection?.remoteDescription) {
      return;
    }

    const pendingCandidates = pendingIceCandidatesRef.current.get(userId);
    if (!pendingCandidates?.length) {
      return;
    }

    pendingIceCandidatesRef.current.delete(userId);
    const { RTCIceCandidate } = ensureWebRTCModule();

    for (const candidate of pendingCandidates) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore pending candidate errors
      }
    }
  }, []);

  useEffect(() => {
    if (!peerManagerRef.current && webRTCModule) {
      peerManagerRef.current = new GroupCallPeerManager(
        getIceConfiguration(),
        webRTCModule.RTCPeerConnection,
      );
    }
  }, []);

  const getLocalStream = useCallback(
    async (enableVideo = true, enableAudio = true): Promise<MediaStream> => {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      const { mediaDevices } = ensureWebRTCModule();

      const stream = await mediaDevices.getUserMedia({
        video: enableVideo
          ? {
              facingMode: "user",
              width: 480,
              height: 360,
              frameRate: 15,
            }
          : false,
        audio: enableAudio,
      });

      localStreamRef.current = stream;
      peerManagerRef.current?.addLocalStreamToAll(stream);
      return stream;
    },
    [],
  );

  const createPeerForParticipant = useCallback(
    async (
      userId: string,
      userName: string,
      isInitiator: boolean = false,
    ): Promise<RTCPeerConnection> => {
      const { RTCPeerConnection } = ensureWebRTCModule();

      if (!peerManagerRef.current) {
        peerManagerRef.current = new GroupCallPeerManager(
          getIceConfiguration(),
          RTCPeerConnection,
        );
      }

      const peerManager = peerManagerRef.current;
      const existingPeer = peerManager.getPeerConnection(userId);
      if (existingPeer) {
        return existingPeer;
      }
      if (!peerManager) {
        throw new Error("Peer manager not initialized");
      }

      const peerConnection = peerManager.createPeerConnection(
        userId,
        userName,
        isInitiator,
        (event: RTCTrackEvent) => {
          const incomingStream = event.streams?.[0] as unknown as
            | MediaStream
            | undefined;

          if (incomingStream) {
            const { MediaStream } = ensureWebRTCModule();
            const nextStream = new MediaStream(incomingStream.getTracks());
            peerManager.setParticipantStream(userId, nextStream);
            onParticipantStream(userId, nextStream);
            return;
          }

          const incomingTrack = event.track as unknown as
            | MediaStreamTrack
            | undefined;

          if (incomingTrack) {
            const { MediaStream } = ensureWebRTCModule();
            const existingStream = peerManager.getParticipantStream(userId);
            const trackStream = existingStream ?? new MediaStream();

            const hasTrack = trackStream
              .getTracks()
              .some((track) => track.id === incomingTrack.id);

            if (!hasTrack) {
              trackStream.addTrack(incomingTrack);
            }

            const nextStream = new MediaStream(trackStream.getTracks());
            peerManager.setParticipantStream(userId, nextStream);
            onParticipantStream(userId, nextStream);
          }
        },
        (candidate: RTCIceCandidate) => {
          onIceCandidate?.(userId, candidate);
        },
        (state: RTCPeerConnectionState) => {
          if (
            state === "failed" ||
            state === "closed"
          ) {
            peerManager.closePeerConnection(userId);
            onParticipantLeft(userId);
          }

          onConnectionStateChange?.(userId, state);
        },
      );

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      } else if (typeof peerConnection.addTransceiver === "function") {
        peerConnection.addTransceiver("audio", { direction: "recvonly" });
        peerConnection.addTransceiver("video", { direction: "recvonly" });
      }

      return peerConnection;
    },
    [onParticipantStream, onParticipantLeft, onIceCandidate, onConnectionStateChange],
  );

  const createOfferForParticipant = useCallback(
    async (userId: string): Promise<RTCSessionDescriptionInit | null> => {
      const peerConnection = peerManagerRef.current?.getPeerConnection(userId);
      if (!peerConnection) {
        return null;
      }

      try {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.setLocalDescription(offer);
        return offer;
      } catch {
        return null;
      }
    },
    [],
  );

  const handleOfferFromParticipant = useCallback(
    async (
      userId: string,
      offer: RTCSessionDescriptionInit,
    ): Promise<RTCSessionDescriptionInit | null> => {
      const peerConnection = peerManagerRef.current?.getPeerConnection(userId);
      if (!peerConnection) {
        return null;
      }

      try {
        const { RTCSessionDescription } = ensureWebRTCModule();
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer),
        );
        await flushPendingIceCandidates(userId);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        return answer;
      } catch {
        return null;
      }
    },
    [flushPendingIceCandidates],
  );

  const handleAnswerFromParticipant = useCallback(
    async (userId: string, answer: RTCSessionDescriptionInit) => {
      const peerConnection = peerManagerRef.current?.getPeerConnection(userId);
      if (!peerConnection) {
        return;
      }

      try {
        const { RTCSessionDescription } = ensureWebRTCModule();
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        await flushPendingIceCandidates(userId);
      } catch {
        // Ignore answer errors
      }
    },
    [flushPendingIceCandidates],
  );

  const addIceCandidateForParticipant = useCallback(
    async (userId: string, candidate: RTCIceCandidateInit) => {
      const peerConnection = peerManagerRef.current?.getPeerConnection(userId);

      if (!peerConnection || !peerConnection.remoteDescription) {
        if (!pendingIceCandidatesRef.current.has(userId)) {
          pendingIceCandidatesRef.current.set(userId, []);
        }
        pendingIceCandidatesRef.current.get(userId)?.push(candidate);
        return;
      }

      try {
        const { RTCIceCandidate } = ensureWebRTCModule();
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore ICE errors
      }
    },
    [],
  );

  const toggleAudioForParticipant = useCallback(
    (userId: string, enabled: boolean): boolean => {
      return peerManagerRef.current?.toggleAudio(userId, enabled) ?? false;
    },
    [],
  );

  const toggleVideoForParticipant = useCallback(
    (userId: string, enabled: boolean): boolean => {
      return peerManagerRef.current?.toggleVideo(userId, enabled) ?? false;
    },
    [],
  );

  const toggleMediaForAll = useCallback(
    (mediaType: "audio" | "video", enabled: boolean): void => {
      peerManagerRef.current?.toggleMediaForAll(mediaType, enabled);
    },
    [],
  );

  const removeParticipant = useCallback((userId: string): void => {
    peerManagerRef.current?.closePeerConnection(userId);
    pendingIceCandidatesRef.current.delete(userId);
  }, []);

  const cleanup = useCallback((): void => {
    peerManagerRef.current?.closeAllPeerConnections();
    pendingIceCandidatesRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  const getAllParticipantIds = useCallback((): string[] => {
    return peerManagerRef.current?.getAllParticipantIds() ?? [];
  }, []);

  const getParticipantStream = useCallback(
    (userId: string): MediaStream | undefined => {
      return peerManagerRef.current?.getParticipantStream(userId);
    },
    [],
  );

  return {
    getLocalStream,
    createPeerForParticipant,
    createOfferForParticipant,
    handleOfferFromParticipant,
    handleAnswerFromParticipant,
    addIceCandidateForParticipant,
    toggleAudioForParticipant,
    toggleVideoForParticipant,
    toggleMediaForAll,
    removeParticipant,
    cleanup,
    getAllParticipantIds,
    getParticipantStream,
    localStream: localStreamRef.current,
    isSupported: Boolean(webRTCModule),
  };
};
