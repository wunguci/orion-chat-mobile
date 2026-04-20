import API_BASE_URL from "@/config/api";
import { io, Socket } from "socket.io-client";

const SOCKET_BASE_URL = (process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL)
  .replace(/\/$/, "")
  .replace(/\/call$/, "");

const CALL_SOCKET_URL = `${SOCKET_BASE_URL}/call`;

class CallSocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  connect(userId: string, token?: string) {
    if (this.socket && this.currentUserId === userId) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentUserId = userId;

    this.socket = io(CALL_SOCKET_URL, {
      query: { userId },
      auth: token ? { token } : undefined,
      transports: ["websocket"],
      forceNew: false,
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.currentUserId = null;
  }
}

export const callSocketService = new CallSocketService();
