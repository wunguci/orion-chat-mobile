import { io, Socket } from "socket.io-client";
import API_BASE_URL from "@/config/api";

const SOCKET_BASE_URL = (
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  API_BASE_URL
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
