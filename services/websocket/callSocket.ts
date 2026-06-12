import { getSocketNamespaceUrl } from "@/config/api";
import { io, Socket } from "socket.io-client";

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

    this.socket = io(getSocketNamespaceUrl("call"), {
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
