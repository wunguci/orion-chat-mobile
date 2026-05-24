import type {
  MediaStream,
  MediaStreamTrack,
  RTCPeerConnection,
  RTCIceCandidate,
} from "react-native-webrtc";

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
  private iceConfiguration: RTCConfiguration;

  constructor(iceConfiguration: RTCConfiguration) {
    this.iceConfiguration = iceConfiguration;
  }

  createPeerConnection(
    userId: string,
    userName: string,
    isInitiator: boolean = false,
    onTrack?: (event: RTCTrackEvent) => void,
    onIceCandidate?: (candidate: RTCIceCandidate) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void,
  ): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.iceConfiguration);

    if (onTrack) {
      peerConnection.ontrack = onTrack;
    }

    if (onIceCandidate) {
      peerConnection.onicecandidate = (event) => {
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

  /**
   * Thay thế video track cho toàn bộ peer connections (dùng khi bật lại camera)
   */
  async replaceVideoTrackForAll(
    newVideoTrack: MediaStreamTrack,
    localStream: MediaStream,
  ): Promise<void> {
    const tasks: Promise<void>[] = [];

    this.peerConnections.forEach((context) => {
      const sender = context.peerConnection
        .getSenders()
        .find((item) => item.track?.kind === "video");

      if (sender?.replaceTrack) {
        tasks.push(sender.replaceTrack(newVideoTrack));
        return;
      }

      context.peerConnection.addTrack(newVideoTrack, localStream);
    });

    await Promise.allSettled(tasks);
  }

  /**
   * Thay thế audio track cho toàn bộ peer connections (dùng khi bật lại micro)
   */
  async replaceAudioTrackForAll(
    newAudioTrack: MediaStreamTrack,
    localStream: MediaStream,
  ): Promise<void> {
    const tasks: Promise<void>[] = [];

    this.peerConnections.forEach((context) => {
      const sender = context.peerConnection
        .getSenders()
        .find((item) => item.track?.kind === "audio");

      if (sender?.replaceTrack) {
        tasks.push(sender.replaceTrack(newAudioTrack));
        return;
      }

      context.peerConnection.addTrack(newAudioTrack, localStream);
    });

    await Promise.allSettled(tasks);
  }

  /**
   * Ngat audio track tren tat ca peer connections
   */
  async clearAudioTrackForAll(): Promise<void> {
    const tasks: Promise<void>[] = [];

    this.peerConnections.forEach((context) => {
      const sender = context.peerConnection
        .getSenders()
        .find((item) => item.track?.kind === "audio");

      if (sender?.replaceTrack) {
        tasks.push(sender.replaceTrack(null));
      } else if (sender?.track) {
        sender.track.enabled = false;
      }
    });

    await Promise.allSettled(tasks);
  }
}
