import { useCallback, useEffect, useRef } from "react";
import type {
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";

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
  webRTCModule = require("react-native-webrtc") as WebRTCModule;
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

const getIceConfiguration = (): RTCConfiguration => {
  const turnUrls = process.env.EXPO_PUBLIC_TURN_URLS;
  const turnUsername = process.env.EXPO_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.EXPO_PUBLIC_TURN_CREDENTIAL;
  const forceRelay = process.env.EXPO_PUBLIC_FORCE_TURN_RELAY === "true";

  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  if (turnUrls && turnUsername && turnCredential) {
    const parsedTurnUrls = turnUrls
      .split(",")
      .map((item) => item.trim())
      .filter(
        (item) =>
          Boolean(item) &&
          (item.startsWith("turn:") || item.startsWith("turns:")),
      );

    if (parsedTurnUrls.length > 0) {
      iceServers.push({
        urls: parsedTurnUrls,
        username: turnUsername,
        credential: turnCredential,
      });
    }
  }

  return {
    iceServers,
    iceCandidatePoolSize: 8,
    iceTransportPolicy: forceRelay ? "relay" : "all",
  };
};

interface UseWebRTCProps {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onIceRestart?: (offer: RTCSessionDescriptionInit) => Promise<void>;
}

export const useWebRTC = ({
  onRemoteStream,
  onIceCandidate,
  onConnectionStateChange,
  onIceRestart,
}: UseWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const iceRestartCountRef = useRef(0);

  const onRemoteStreamRef = useRef(onRemoteStream);
  const onIceCandidateRef = useRef(onIceCandidate);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  const onIceRestartRef = useRef(onIceRestart);

  useEffect(() => {
    onRemoteStreamRef.current = onRemoteStream;
  }, [onRemoteStream]);

  useEffect(() => {
    onIceCandidateRef.current = onIceCandidate;
  }, [onIceCandidate]);

  useEffect(() => {
    onConnectionStateChangeRef.current = onConnectionStateChange;
  }, [onConnectionStateChange]);

  useEffect(() => {
    onIceRestartRef.current = onIceRestart;
  }, [onIceRestart]);

  const restartIce = useCallback(async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection || !onIceRestartRef.current) {
      return;
    }

    try {
      const offer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(offer);
      await onIceRestartRef.current(offer);
    } catch (error) {
      console.log("[WebRTC] ICE restart failed", error);
    }
  }, []);

  const flushPendingIceCandidates = useCallback(async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection?.remoteDescription) {
      return;
    }

    if (pendingIceCandidatesRef.current.length === 0) {
      return;
    }

    const pending = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of pending) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.log("[WebRTC] Failed to flush ICE candidate", error);
      }
    }
  }, []);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const { MediaStream, RTCPeerConnection } = ensureWebRTCModule();

    const peerConnection = new RTCPeerConnection(getIceConfiguration());

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidateRef.current(event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams || [];
      if (stream) {
        onRemoteStreamRef.current(stream);
      } else if (event.track) {
        onRemoteStreamRef.current(new MediaStream([event.track]));
      }
    };

    peerConnection.onconnectionstatechange = () => {
      onConnectionStateChangeRef.current(peerConnection.connectionState);

      if (
        peerConnection.connectionState === "failed" &&
        iceRestartCountRef.current < 3
      ) {
        iceRestartCountRef.current += 1;
        void restartIce();
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === "disconnected") {
        setTimeout(() => {
          if (
            peerConnectionRef.current?.iceConnectionState === "disconnected"
          ) {
            void restartIce();
          }
        }, 2500);
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [restartIce]);

  const getLocalStream = useCallback(
    async (videoEnabled = true, audioEnabled = true) => {
      const { mediaDevices } = ensureWebRTCModule();

      const stream = await mediaDevices.getUserMedia({
        video: videoEnabled
          ? {
              facingMode: "user",
              width: 480,
              height: 360,
              frameRate: 15,
            }
          : false,
        audio: audioEnabled
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      });

      localStreamRef.current = stream;

      const peerConnection = peerConnectionRef.current;
      if (peerConnection) {
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });
      }

      return stream;
    },
    [],
  );

  const createOffer = useCallback(async () => {
    const peerConnection = initializePeerConnection();
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerConnection.setLocalDescription(offer);
    return offer;
  }, [initializePeerConnection]);

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      const { RTCSessionDescription } = ensureWebRTCModule();

      const peerConnection = initializePeerConnection();
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer),
      );
      await flushPendingIceCandidates();

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      return answer;
    },
    [flushPendingIceCandidates, initializePeerConnection],
  );

  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      const { RTCSessionDescription } = ensureWebRTCModule();

      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        throw new Error("Peer connection not initialized");
      }

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
      await flushPendingIceCandidates();
    },
    [flushPendingIceCandidates],
  );

  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      const { RTCIceCandidate } = ensureWebRTCModule();

      const peerConnection = peerConnectionRef.current;

      if (!peerConnection || !peerConnection.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.log("[WebRTC] Failed to add ICE candidate", error);
      }
    },
    [],
  );

  const toggleVideo = useCallback(async (enabled: boolean) => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }

    if (!enabled) {
      // Giữ track để bật lại không bị đen
      stream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      return;
    }

    const videoTracks = stream.getVideoTracks();
    const shouldRecreate =
      videoTracks.length === 0 || videoTracks[0].readyState === "ended";

    if (!shouldRecreate) {
      videoTracks.forEach((track) => {
        track.enabled = true;
      });
      return;
    }

    try {
      const { mediaDevices, MediaStream } = ensureWebRTCModule();
      const newStream = await mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: 480,
          height: 360,
          frameRate: 15,
        },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const audioTracks = stream.getAudioTracks();
      const rebuiltStream = new MediaStream([
        ...audioTracks,
        newVideoTrack,
      ]);
      if (!newVideoTrack) {
        return;
      }

      const peerConnection = peerConnectionRef.current;
      if (peerConnection) {
        const sender = peerConnection
          .getSenders()
          .find((item) => item.track?.kind === "video");

        if (sender?.replaceTrack) {
          await sender.replaceTrack(newVideoTrack);
        } else {
          peerConnection.addTrack(newVideoTrack, rebuiltStream);
        }
      }

      // cập nhật local stream để preview đúng track mới
      videoTracks.forEach((track) => {
        try {
          stream.removeTrack(track);
        } catch {
          // ignore removeTrack errors
        }
        track.stop();
      });
      stream.addTrack(newVideoTrack);
      localStreamRef.current = rebuiltStream;
      return rebuiltStream;
    } catch (error) {
      console.log("[WebRTC] Failed to re-enable video", error);
    }
  }, []);

  const toggleAudio = useCallback(async (enabled: boolean) => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }

    if (!enabled) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      return;
    }

    const audioTracks = stream.getAudioTracks();
    const shouldRecreate =
      audioTracks.length === 0 || audioTracks[0].readyState === "ended";

    if (!shouldRecreate) {
      audioTracks.forEach((track) => {
        track.enabled = true;
      });
      return;
    }

    try {
      const { mediaDevices } = ensureWebRTCModule();
      const newAudioStream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const newAudioTrack = newAudioStream.getAudioTracks()[0];
      if (!newAudioTrack) {
        return;
      }

      const peerConnection = peerConnectionRef.current;
      if (peerConnection) {
        const sender = peerConnection
          .getSenders()
          .find((item) => item.track?.kind === "audio");

        if (sender?.replaceTrack) {
          await sender.replaceTrack(newAudioTrack);
        } else {
          peerConnection.addTrack(newAudioTrack, stream);
        }
      }

      audioTracks.forEach((track) => {
        try {
          stream.removeTrack(track);
        } catch {
          // ignore removeTrack errors
        }
        track.stop();
      });
      stream.addTrack(newAudioTrack);
    } catch (error) {
      console.log("[WebRTC] Failed to re-enable audio", error);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    pendingIceCandidatesRef.current = [];
    iceRestartCountRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    initializePeerConnection,
    getLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    toggleVideo,
    toggleAudio,
    cleanup,
    restartIce,
    isSupported: Boolean(webRTCModule),
  };
};
