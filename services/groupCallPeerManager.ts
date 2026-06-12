import type {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
} from "@stream-io/react-native-webrtc";

type RTCPeerConnectionConstructor = new (
  configuration?: RTCConfiguration,
) => RTCPeerConnection;

interface PeerConnectionContext {
  peerConnection: RTCPeerConnection;
  userId: string;
  userName: string;
  stream?: MediaStream;
  isInitiator: boolean;
  isAnswerer: boolean;
}

export class GroupCallPeerManager {
  private peerConnections: Map<string, PeerConnectionContext> = new Map();
  private iceConfiguration: any;
  private RTCPeerConnectionCtor: RTCPeerConnectionConstructor | null;

  constructor(
    iceConfiguration: any,
    RTCPeerConnectionCtor: RTCPeerConnectionConstructor | null,
  ) {
    this.iceConfiguration = iceConfiguration;
    this.RTCPeerConnectionCtor = RTCPeerConnectionCtor;
  }

  createPeerConnection(
    userId: string,
    userName: string,
    isInitiator: boolean = false,
    onTrack?: (event: any) => void,
    onIceCandidate?: (candidate: RTCIceCandidate) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void,
  ): RTCPeerConnection {
    if (!this.RTCPeerConnectionCtor) {
      throw new Error(
        "WebRTC native module is unavailable in this runtime. Use a development build instead of Expo Go.",
      );
    }

    const peerConnection = new this.RTCPeerConnectionCtor(
      this.iceConfiguration,
    );

    if (onTrack) {
      peerConnection.ontrack = onTrack;
    }

    if (onIceCandidate) {
      peerConnection.onicecandidate = (event: any) => {
        if (event.candidate) {
          onIceCandidate(event.candidate as RTCIceCandidate);
        }
      };
    }

    if (onConnectionStateChange) {
      peerConnection.onconnectionstatechange = () => {
        onConnectionStateChange(peerConnection.connectionState);
      };
    }

    const context: PeerConnectionContext = {
      peerConnection,
      userId,
      userName,
      isInitiator,
      isAnswerer: false,
    };

    this.peerConnections.set(userId, context);
    return peerConnection;
  }

  addLocalStreamToAll(localStream: MediaStream): void {
    this.peerConnections.forEach((context) => {
      localStream.getTracks().forEach((track) => {
        context.peerConnection.addTrack(track, localStream);
      });
    });
  }

  getPeerConnection(userId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(userId)?.peerConnection;
  }

  getParticipantStream(userId: string): MediaStream | undefined {
    return this.peerConnections.get(userId)?.stream;
  }

  setParticipantStream(userId: string, stream: MediaStream): void {
    const context = this.peerConnections.get(userId);
    if (context) {
      context.stream = stream;
    }
  }

  closePeerConnection(userId: string): void {
    const context = this.peerConnections.get(userId);
    if (context) {
      context.peerConnection.close();
      this.peerConnections.delete(userId);
    }
  }

  closeAllPeerConnections(): void {
    this.peerConnections.forEach((context) => {
      context.peerConnection.close();
    });
    this.peerConnections.clear();
  }

  getAllParticipantIds(): string[] {
    return Array.from(this.peerConnections.keys());
  }

  toggleAudio(userId: string, enabled: boolean): boolean {
    const peerConnection = this.getPeerConnection(userId);
    if (!peerConnection) return false;

    peerConnection.getSenders().forEach((sender) => {
      if (sender.track?.kind === "audio") {
        sender.track.enabled = enabled;
      }
    });
    return true;
  }

  toggleVideo(userId: string, enabled: boolean): boolean {
    const peerConnection = this.getPeerConnection(userId);
    if (!peerConnection) return false;

    peerConnection.getSenders().forEach((sender) => {
      if (sender.track?.kind === "video") {
        sender.track.enabled = enabled;
      }
    });
    return true;
  }

  toggleMediaForAll(mediaType: "audio" | "video", enabled: boolean): void {
    this.peerConnections.forEach((_, userId) => {
      if (mediaType === "audio") {
        this.toggleAudio(userId, enabled);
      } else {
        this.toggleVideo(userId, enabled);
      }
    });
  }
}
