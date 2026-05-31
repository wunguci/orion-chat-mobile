import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSocketNamespaceUrl } from "@/config/api";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

/**
 * Thông tin tin nhắn từ WebSocket
 */
export interface SocketMessage {
  conversationId: string;
  message: {
    _id: string;
    conversationId: string;
    senderBy: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    messageType: string;
    createdAt: string;

    clientMessageId?: string;
    // Reply message
    replyToMessageId?: string;
    replyToMessagePreview?: {
      messageId?: string;
      senderName?: string;
      content?: string;
      snippet?: string;
      createdAt?: string;
    };
    messageStatus: "SENT" | "DELIVERED" | "READ";

    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;

    reactions?: [];
    callData?: any;
  };
}

/**
 * Callback khi gửi tin nhắn thành công
 */
export type SendAckCallback = (data: {
  clientMessageId: string;
  messageId: string;
  messageStatus: string;
  timestamp: string;
}) => void;

// ═══════════════════════════════════════════════════════════
// CHAT SOCKET SERVICE
// ═══════════════════════════════════════════════════════════

class ChatSocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private messageListeners: Map<string, (message: SocketMessage) => void> =
    new Map();
  private conversationListeners: Map<string, (data: any) => void> = new Map();
  private reactionListeners: Map<string, (data: any) => void> = new Map();
  private recallListeners: Map<string, (data: any) => void> = new Map();
  private deleteListeners: Map<string, (data: any) => void> = new Map();
  private conversationDeletedListeners: Set<(data: any) => void> = new Set();
  private connectedListeners: Set<() => void> = new Set();
  private globalMessageListeners: Set<(message: SocketMessage) => void> =
    new Set();

  /**
   * Khởi tạo WebSocket connection
   * - Lấy JWT token từ AsyncStorage
   * - Kết nối tới server qua /chat namespace
   * - AWAIT khi socket thực sự connected
   */
  async connect(): Promise<void> {
    // Nếu đã connecting hoặc connected, không cần kết nối lại
    if (this.socket?.connected) {
      //console.log("[ChatSocket] Already connected");
      return;
    }

    if (this.isConnecting) {
      //console.log("[ChatSocket] Already connecting, waiting...");
      // Chờ connection hoàn thành
      return new Promise((resolve) => {
        const checkConnected = () => {
          if (this.socket?.connected) {
            resolve();
          } else {
            setTimeout(checkConnected, 100);
          }
        };
        checkConnected();
      });
    }

    this.isConnecting = true;

    try {
      // Lấy JWT token và userId từ AsyncStorage
      const token = await this.getAuthToken();
      const userId = await this.getAuthUserId();
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Tạo Socket.io connection với JWT token
      const socketUrl = getSocketNamespaceUrl("chat");
      this.socket = io(socketUrl || "http://localhost:3000/chat", {
        path: "/socket.io",
        auth: {
          token,
          ...(userId ? { userId } : {}),
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ["websocket"],
      });

      // Xử lý connection events
      this.setupConnectionHandlers();

      //console.log("[ChatSocket] Connecting to", socketUrl);

      // WAIT for socket to actually connect
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Socket connection timeout"));
        }, 10000);

        this.socket!.once("connect", () => {
          clearTimeout(timeout);
          //console.log("[ChatSocket] Connected and ready");
          this.isConnecting = false;
          resolve();
        });

        this.socket!.once("error", (error) => {
          clearTimeout(timeout);
          console.error("[ChatSocket] Connection error:", error);
          this.isConnecting = false;
          reject(error);
        });
      });
    } catch (error) {
      console.error("[ChatSocket] Connection error:", error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Setup các handlers cho connection events
   */
  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    // Khi kết nối thành công
    this.socket.on("connect", () => {
      //console.log("[ChatSocket] Connected successfully");
      this.isConnecting = false;
      this.rejoinConversations();
      this.connectedListeners.forEach((callback) => callback());
    });

    // Khi mất kết nối
    this.socket.on("disconnect", (reason) => {
      //console.log("[ChatSocket] Disconnected:", reason);
    });

    // Khi có lỗi
    this.socket.on("error", (error) => {
      console.error("[ChatSocket] Error:", error);
    });

    // Khi reconnect
    this.socket.on("reconnect", () => {
      //console.log("[ChatSocket] Reconnected - re-registering listeners");
      this.setupMessageListeners();
      this.connectedListeners.forEach((callback) => callback());
    });

    // Setup listeners
    this.setupMessageListeners();

    // DEBUG: Log tất cả events từ server
    this.socket.onAny((eventName: string, ...args: any[]) => {
      if (!eventName.startsWith("ping") && !eventName.startsWith("pong")) {
        //console.log(`[ChatSocket] All events - ${eventName}:`, args?.[0]);
      }
    });
  }

  /**
   * Setup global message listeners
   */
  private setupMessageListeners(): void {
    if (!this.socket) return;

    //console.log("[ChatSocket] Setting up message listeners");

    this.socket.off("chat:message_new");
    this.socket.off("chat:message_ack");
    this.socket.off("chat:message_reaction_updated");
    this.socket.off("chat:message_recalled");
    this.socket.off("chat:message_deleted");
    this.socket.off("conversation:deleted");

    // Listen tin nhắn mới từ server
    this.socket.on("chat:message_new", (serverData: any) => {
      const serverMessage = serverData.message || serverData;
      const data: SocketMessage = {
        conversationId:
          serverData.conversationId || serverMessage.conversationId,
        message: {
          _id: serverMessage._id || serverMessage.messageId,
          conversationId:
            serverMessage.conversationId || serverData.conversationId,
          senderBy: serverMessage.senderBy,
          senderName: serverMessage.senderName,
          senderAvatar: serverMessage.senderAvatar,
          content: serverMessage.content,
          messageType: serverMessage.messageType || serverMessage.type,
          createdAt: serverMessage.createdAt || serverMessage.timestamp,
          clientMessageId: serverMessage.clientMessageId,
          replyToMessageId: serverMessage.replyToMessageId,
          replyToMessagePreview: serverMessage.replyToMessagePreview,
          messageStatus: "SENT",
          mediaUrl: serverMessage.mediaUrl,
          fileName: serverMessage.fileName,
          fileSize: serverMessage.fileSize,
          mimeType: serverMessage.mimeType,
          reactions: serverMessage.reactions,
          callData: serverMessage.callData,
        },
      };

      // console.log("[ChatSocket] Received message_new:", {
      //   conversationId: data.conversationId,
      //   messageId: data.message._id,
      //   senderId: data.message.senderName,
      //   messageType: data.message.messageType,
      //   content: data.message.content
      //     ? data.message.content.substring(0, 30)
      //     : "Attachment",
      // });

      // Gọi callback nếu có listener cho conversation này
      const callback = this.messageListeners.get(data.conversationId);
      if (callback) {
        // console.log(
        //   "[ChatSocket] Calling message callback for:",
        //   data.conversationId,
        // );
        callback(data);
      }

      this.globalMessageListeners.forEach((listener) => listener(data));
    });

    // Listen ACK từ server (xác nhận tin nhắn được lưu)
    this.socket.on("chat:message_ack", (ackData: any) => {
      // console.log("[ChatSocket] Received message_ack:", {
      //   conversationId: ackData.conversationId,
      //   clientMessageId: ackData.clientMessageId,
      //   messageId: ackData.messageId || ackData._id,
      // });

      const callback = this.conversationListeners.get(ackData.conversationId);
      if (callback) {
        // console.log(
        //   "[ChatSocket] Calling ACK callback for:",
        //   ackData.conversationId,
        // );
        callback({
          clientMessageId: ackData.clientMessageId,
          messageId: ackData.messageId || ackData._id,
          messageStatus: ackData.messageStatus || "SENT",
          timestamp: ackData.createdAt || ackData.timestamp,
        });
      }
      // else {
      //   console.warn(
      //     "[ChatSocket] No ACK listener for conversation:",
      //     ackData.conversationId,
      //   );
      // }
    });

    // Listen emoji reactions
    this.socket.on("chat:message_reaction_updated", (reactionData: any) => {
      console.log("[ChatSocket] Received message_reaction_updated:", {
        conversationId: reactionData.conversationId,
        messageId: reactionData.messageId,
        reactionsCount: reactionData.reactions?.length,
      });

      const callback = this.reactionListeners.get(reactionData.conversationId);
      if (callback) {
        callback({
          conversationId: reactionData.conversationId,
          messageId: reactionData.messageId,
          reactions: reactionData.reactions,
          actedBy: reactionData.actedBy,
          action: reactionData.action,
          emoji: reactionData.emoji,
        });
      }
    });

    // Listen message recalled events
    this.socket.on("chat:message_recalled", (recallData: any) => {
      console.log("[ChatSocket] Received message_recalled:", {
        conversationId: recallData.conversationId,
        messageId: recallData.messageId,
        revokedBy: recallData.revokedBy,
      });

      const callback = this.recallListeners.get(recallData.conversationId);
      if (callback) {
        callback({
          conversationId: recallData.conversationId,
          messageId: recallData.messageId,
          revokedBy: recallData.revokedBy,
          revokedAt: recallData.revokedAt,
          isRevoked: recallData.isRevoked,
        });
      }
    });

    // Listen message deleted events
    this.socket.on("chat:message_deleted", (deleteData: any) => {
      const callback = this.deleteListeners.get(deleteData.conversationId);
      if (callback) {
        callback({
          conversationId: deleteData.conversationId,
          messageId: deleteData.messageId,
          deletedBy: deleteData.deletedBy,
          isDeleted: deleteData.isDeleted,
        });
      }
    });

    this.socket.on("conversation:deleted", (deleteData: any) => {
      this.conversationDeletedListeners.forEach((callback) => {
        callback(deleteData);
      });
    });
  }

  private joinedConversations: Set<string> = new Set();

  /**
   * Join một Conversation (để listen tin nhắn)
   * - Emit event chat:join_conversation tới server
   * - Callback được set qua onMessage() trước join
   */
  joinConversation(conversationId: string): void {
    this.joinedConversations.add(conversationId);

    if (!this.socket?.connected) {
      //console.warn("[ChatSocket] Socket not connected, cannot join");
      return;
    }

    //console.log("[ChatSocket] Joining conversation:", conversationId);
    // Emit event chat:join_conversation tới server
    const requestId = `join-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.socket.emit("chat:join_conversation", {
      requestId,
      conversationId,
    });
  }

  private rejoinConversations() {
    this.joinedConversations.forEach((conversationId) => {
      //console.log("[ChatSocket] Rejoining:", conversationId);
      const requestId = `rejoin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      this.socket?.emit("chat:join_conversation", {
        requestId,
        conversationId,
      });
    });
  }

  /**
   * Leave một Conversation (ngừng listen)
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) return;

    //console.log("[ChatSocket] Leaving conversation:", conversationId);
    const requestId = `leave-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.socket.emit("chat:leave_conversation", {
      requestId,
      conversationId,
    });

    // Chỉ xóa callback khỏi Maps, không gọi socket.off() để tránh ảnh hưởng đến các conversation khác
    this.messageListeners.delete(conversationId);
    this.conversationListeners.delete(conversationId);
    this.reactionListeners.delete(conversationId);
    this.recallListeners.delete(conversationId);
    this.deleteListeners.delete(conversationId);

    // console.log(
    //   "[ChatSocket] Cleared listeners for conversation:",
    //   conversationId,
    // );
  }

  /**
   * Gửi tin nhắn qua WebSocket
   * - Emit event chat:send_message tới server
   * - Callback sẽ được gọi khi server gửi ACK
   */
  sendMessage(
    conversationId: string,
    content: string,
    clientMessageId: string,
    onAck: SendAckCallback,
  ): void {
    if (!this.socket?.connected) {
      console.error("[ChatSocket] Socket not connected:", {
        isConnected: this.socket?.connected,
        hasSocket: !!this.socket,
      });
      return;
    }

    const requestId = clientMessageId;

    console.log("[ChatSocket] Sending message:", {
      conversationId,
      content,
      clientMessageId,
      requestId,
      socketConnected: this.socket.connected,
      socketId: this.socket.id,
    });

    // Add timeout để catch nếu server không respond
    const timeoutId = setTimeout(() => {
      console.error(
        "[ChatSocket] TIMEOUT: No ACK response from server after 5s",
        {
          clientMessageId,
          conversationId,
          requestId,
        },
      );
    }, 5000);

    this.socket.emit(
      "chat:send_message",
      {
        requestId,
        conversationId,
        content,
        clientMessageId,
        type: "text",
      },
      (ackData: any, error: any) => {
        clearTimeout(timeoutId);
        // console.log("[ChatSocket] Message emit callback received:", {
        //   ackData,
        //   error,
        //   hasAckData: !!ackData,
        //   hasError: !!error,
        // });

        if (error) {
          console.error("[ChatSocket] Server error on message emit:", error);
          return;
        }

        if (!ackData) {
          console.warn("[ChatSocket] Callback received but no data");
          return;
        }

        // Handle response format - server return { ok, data: { ... } }
        const responseData = ackData.data || ackData;

        // console.log("[ChatSocket] Message ACK received successfully:", {
        //   messageId: responseData.messageId,
        //   timestamp: responseData.timestamp,
        // });

        // Gọi callback khi nhận được ACK từ server
        onAck({
          clientMessageId: responseData.clientMessageId,
          messageId: responseData.messageId,
          messageStatus: "SENT",
          timestamp: responseData.timestamp || new Date().toISOString(),
        });
      },
    );

    //  Also log if emit has an error immediately
    this.socket.once("error", (error) => {
      console.error("[ChatSocket] Socket error after emit:", error);
    });
  }

  /**
   * Gửi một tin nhắn văn bản qua WebSocket và chờ acknowledgement (ACK) từ server.
   *
   * Cơ chế hoạt động:
   * - Emit event "chat:send_message" lên server kèm timeout 10 giây
   * - Server xử lý xong sẽ gọi callback (ACK) với kết quả
   * - Nếu server không phản hồi trong 10s → socket tự động reject với lỗi timeout
   *
   * @param conversationId   - ID cuộc hội thoại
   * @param content          - Nội dung tin nhắn
   * @param clientMessageId  - ID do client tạo sẵn, dùng để map với pending queue
   * @returns Promise resolve với thông tin tin nhắn đã được server xác nhận
   */
  sendMessageAsync(
    conversationId: string,
    content: string,
    clientMessageId: string,
    replyToMessageId?: string | null,
  ): Promise<{
    clientMessageId: string;
    messageId: string;
    messageStatus: string;
    timestamp: string;
  }> {
    if (!this.socket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    const requestId = clientMessageId;

    return new Promise((resolve, reject) => {
      this.socket!.timeout(10000).emit(
        "chat:send_message",
        {
          requestId,
          conversationId,
          content,
          clientMessageId,
          type: "text",
          replyToMessageId: replyToMessageId || undefined,
        },
        (error: any, ackData: any) => {
          if (error) {
            reject(error);
            return;
          }

          const responseData = ackData?.data || ackData;

          if (!responseData?.messageId) {
            reject(new Error("Invalid message ACK"));
            return;
          }

          resolve({
            clientMessageId: responseData.clientMessageId || clientMessageId,
            messageId: responseData.messageId,
            messageStatus: "SENT",
            timestamp: responseData.timestamp || new Date().toISOString(),
          });
        },
      );
    });
  }

  sendCallMessage(payload: {
    conversationId: string;
    callType: "audio" | "video";
    callStatus: "active" | "completed" | "missed" | "declined";
    duration: number;
    callId: string;
    clientMessageId: string;
    onAck: SendAckCallback;
  }): void {
    if (!this.socket?.connected) {
      console.error("[ChatSocket] Socket not connected for call message");
      return;
    }

    const {
      conversationId,
      callType,
      callStatus,
      duration,
      callId,
      clientMessageId,
      onAck,
    } = payload;
    const requestId = clientMessageId;

    this.socket.emit(
      "chat:send_message",
      {
        requestId,
        conversationId,
        content: "",
        clientMessageId,
        type: "call",
        callData: {
          callType,
          callStatus,
          duration,
          isInitiator: true,
          wasRejected: false,
          callId,
        },
      },
      (ackData: any, error: any) => {
        if (error) {
          console.error("[ChatSocket] Error emitting call message:", error);
          return;
        }
        if (!ackData) return;
        const responseData = ackData.data || ackData;
        onAck({
          clientMessageId: responseData.clientMessageId,
          messageId: responseData.messageId,
          messageStatus: "SENT",
          timestamp: responseData.timestamp || new Date().toISOString(),
        });
      },
    );
  }

  sendAttachmentMessage(
    conversationId: string,
    mediaUrl: string,
    messageType: "IMAGE" | "FILE" | "VIDEO" | "VIDEO_PREVIEW",
    clientMessageId: string,
    onAck: SendAckCallback,
    attachmentData?: {
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      videoDuration?: number;
    },
  ): void {
    if (!this.socket?.connected) {
      //console.error("[ChatSocket] Socket not connected");
      return;
    }

    // Map message types to lowercase for API
    let apiType: "image" | "file" | "video" = "file";
    if (messageType === "IMAGE") apiType = "image";
    else if (messageType === "VIDEO" || messageType === "VIDEO_PREVIEW")
      apiType = "video";

    const payload = {
      requestId: clientMessageId,
      conversationId,
      clientMessageId,
      mediaUrl,
      type: apiType,
      messageType,
      content: attachmentData?.fileName || "Attachment",
      fileName: attachmentData?.fileName,
      fileSize: attachmentData?.fileSize,
      mimeType: attachmentData?.mimeType,
      videoDuration: attachmentData?.videoDuration,
    };

    // console.log("[ChatSocket] Sending attachment message:", {
    //   conversationId,
    //   messageType,
    //   clientMessageId,
    // });

    const timeoutId = setTimeout(() => {
      console.error(
        "[ChatSocket] TIMEOUT: No ACK response from server after 5s",
        {
          clientMessageId,
          conversationId,
        },
      );
    }, 5000);

    this.socket.emit(
      "chat:send_message",
      payload,
      (ackData: any, error: any) => {
        clearTimeout(timeoutId);

        if (error) {
          // console.error(
          //   "[ChatSocket] Server error on attachment message emit:",
          //   error,
          // );
          return;
        }

        const responseData = ackData.data || ackData;

        // console.log("[ChatSocket] Attachment message ACK received:", {
        //   messageId: responseData.messageId,
        //   timestamp: responseData.timestamp,
        // });

        onAck({
          clientMessageId: responseData.clientMessageId,
          messageId: responseData.messageId,
          messageStatus: "SENT",
          timestamp: responseData.timestamp || new Date().toISOString(),
        });
      },
    );
  }

  /**
   * Đăng ký callback để listen tin nhắn mới
   */
  onMessage(
    conversationId: string,
    callback: (message: SocketMessage) => void,
  ): void {
    // console.log(
    //   "[ChatSocket] Registering message listener for conversation:",
    //   conversationId,
    // );
    this.messageListeners.set(conversationId, callback);
  }

  onAnyMessage(callback: (message: SocketMessage) => void): void {
    this.globalMessageListeners.add(callback);
  }

  offAnyMessage(callback: (message: SocketMessage) => void): void {
    this.globalMessageListeners.delete(callback);
  }

  onConnected(callback: () => void): void {
    this.connectedListeners.add(callback);
  }

  offConnected(callback: () => void): void {
    this.connectedListeners.delete(callback);
  }

  /**
   * Đăng ký callback để listen ACK
   */
  onAck(conversationId: string, callback: (data: any) => void): void {
    // console.log(
    //   "[ChatSocket] Registering ACK listener for conversation:",
    //   conversationId,
    // );
    this.conversationListeners.set(conversationId, callback);
  }

  /**
   * Đăng ký callback để listen emoji reactions
   */
  onReaction(conversationId: string, callback: (data: any) => void): void {
    this.reactionListeners.set(conversationId, callback);
  }

  /**
   * Đăng ký callback để listen message recalled events
   */
  onRecall(conversationId: string, callback: (data: any) => void): void {
    this.recallListeners.set(conversationId, callback);
  }

  onDelete(conversationId: string, callback: (data: any) => void): void {
    this.deleteListeners.set(conversationId, callback);
  }

  onConversationDeleted(callback: (data: any) => void): void {
    this.conversationDeletedListeners.add(callback);
  }

  offConversationDeleted(callback: (data: any) => void): void {
    this.conversationDeletedListeners.delete(callback);
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      //console.log("[ChatSocket] Disconnecting");
      this.socket.disconnect();
      this.socket = null;
      this.messageListeners.clear();
      this.conversationListeners.clear();
      this.reactionListeners.clear();
      this.recallListeners.clear();
      this.deleteListeners.clear();
      this.conversationDeletedListeners.clear();
      this.connectedListeners.clear();
    }
  }

  /**
   * Kiểm tra xem socket có connected không
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Lấy JWT token từ AsyncStorage
   */
  private async getAuthToken(): Promise<string | null> {
    const tokenCandidates = [
      await AsyncStorage.getItem("auth_token"),
      await AsyncStorage.getItem("token"),
      await AsyncStorage.getItem("accessToken"),
    ];

    return tokenCandidates.find((item) => !!item) || null;
  }

  private async getAuthUserId(): Promise<string | null> {
    try {
      const rawUser = await AsyncStorage.getItem("auth_user");
      if (!rawUser) return null;
      const parsed = JSON.parse(rawUser) as { userId?: string };
      return parsed.userId || null;
    } catch (error) {
      console.warn("[ChatSocket] Unable to read auth_user:", error);
      return null;
    }
  }
}

export const chatSocketService = new ChatSocketService();
