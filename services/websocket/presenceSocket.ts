import { io, Socket } from "socket.io-client";

const SOCKET_BASE_URL = (
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000"
)
  .replace(/\/$/, "")
  .replace(/\/presence$/, "");

const PRESENCE_URL = `${SOCKET_BASE_URL}/presence`;

class PresenceSocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(PRESENCE_URL, {
      query: { userId },
      transports: ["websocket"],
      forceNew: false,
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const presenceSocketService = new PresenceSocketService();
