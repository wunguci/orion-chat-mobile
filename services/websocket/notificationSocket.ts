import API_BASE_URL from "@/config/api";
import { io, Socket } from "socket.io-client";

const SOCKET_BASE_URL = (process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL)
  .replace(/\/$/, "")
  .replace(/\/notifications$/, "");

const NOTIFICATION_URL = `${SOCKET_BASE_URL}/notifications`;

class NotificationSocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  connect(userId: string, token?: string) {
    if (this.socket?.connected && this.currentUserId === userId) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentUserId = userId;

    this.socket = io(NOTIFICATION_URL, {
      query: { userId },
      auth: token ? { token } : undefined,
      transports: ["websocket"],
      forceNew: false,
    });

    this.socket.on("connect", () => {
      this.socket?.emit("notifications:join", { userId });
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.currentUserId = null;
  }
}

export const notificationSocketService = new NotificationSocketService();
