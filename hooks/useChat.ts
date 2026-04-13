import { AttachmentAsset, Message, MessageType } from "@/types/chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { chatApi, MessageItem } from "@/services/api/chat";
import {
  chatSocketService,
  SocketMessage,
} from "@/services/websocket/chatSocket";

/**
 * Generate unique ID cho client message
 */
function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

/**
 * Trạng thái của useChat hook
 */
interface UseChatState {
  messages: Message[];
  inputText: string;
  isLoading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════
// HOOK - useChat
// ═══════════════════════════════════════════════════════════

/**
 * Custom hook để quản lý chat với một conversation
 *
 * Luồng xử lý:
 * 1. Khi component mount: kết nối WebSocket + tải lịch sử tin nhắn từ API
 * 2. Lắng nghe socket events: 'message:new', 'message:ack' từ server
 * 3. Khi user gửi message: emit qua WebSocket tới server
 * 4. Server lưu MongoDB + emit 'message:new' cho users trong conversation
 * 5. Cập nhật UI khi có tin nhắn mới
 */
export const useChat = (conversationId: string) => {
  const [state, setState] = useState<UseChatState>({
    messages: [],
    inputText: "",
    isLoading: false,
    error: null,
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // INITIALIZERS
  // ─────────────────────────────────────────────────────────

  /**
   * Lấy ID user hiện tại từ AsyncStorage
   */
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const candidates = [
        await AsyncStorage.getItem("auth_user"),
        await AsyncStorage.getItem("user"),
        await AsyncStorage.getItem("current_user"),
        await AsyncStorage.getItem("userId"),
      ];

      for (const raw of candidates) {
        if (!raw) continue;
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          const id = parsed?.id || parsed?.userId;
          if (id && isMounted) {
            setCurrentUserId(String(id));
            return;
          }
        } catch {
          continue;
        }
      }
    };

    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  // ─────────────────────────────────────────────────────────
  // CHAT INITIALIZATION & CLEANUP
  // ─────────────────────────────────────────────────────────

  /**
   * Khởi tạo chat - kết nối WebSocket + join conversation + tải lịch sử + setup listeners
   * Chỉ chạy khi conversationId hoặc currentUserId thay đổi
   */
  useEffect(() => {
    if (!conversationId || !currentUserId) {
      // console.log("[useChat] Waiting for conversationId and currentUserId", {
      //   hasConversationId: !!conversationId,
      //   hasCurrentUserId: !!currentUserId,
      // });
      return;
    }

    let isMounted = true;

    const initializeChat = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Connect socket nếu chưa connect
        if (!chatSocketService.isConnected()) {
          //console.log("[useChat] Socket not connected, connecting...");
          await chatSocketService.connect();
        }

        if (!isMounted) return;

        //console.log("[useChat] Joining conversation:", conversationId);
        // Join conversation
        chatSocketService.joinConversation(conversationId);

        // Tải lịch sử tin nhắn từ API
        //console.log("[useChat] Loading messages from API...");
        const messagesFromApi = await chatApi.getMessages(
          conversationId,
          50,
          0,
        );

        if (!isMounted) return;

        const formattedMessages = (messagesFromApi.items || []).map((msg) =>
          convertApiMessageToUIMessage(msg, currentUserId),
        );

        // Sắp xếp messages: cũ → mới
        const sortedMessages = formattedMessages.sort((a, b) => {
          const dateA =
            new Date(a.timestamp.includes(":") ? a.timestamp : "").getTime() ||
            0;
          const dateB =
            new Date(b.timestamp.includes(":") ? b.timestamp : "").getTime() ||
            0;
          return dateA - dateB;
        });

        setState((prev) => ({
          ...prev,
          messages: sortedMessages,
          isLoading: false,
        }));

        // Setup socket listeners
        if (!isMounted) return;

        //console.log("[useChat] Setting up socket event listeners...");

        // Handler cho tin nhắn mới từ WebSocket
        const handleNewMessage = (socketMsg: SocketMessage) => {
          if (!isMounted) return;

          // Thêm vào danh sách tin nhắn
          setState((prev) => {
            if (socketMsg.message.clientMessageId) {
              const index = prev.messages.findIndex(
                (m) => m.id === socketMsg.message.clientMessageId,
              );

              if (index !== -1) {
                const updateMsg = [...prev.messages];
                updateMsg[index] = {
                  ...updateMsg[index],
                  id: socketMsg.message._id,
                  status: "read",
                };
                return {
                  ...prev,
                  messages: updateMsg,
                };
              }
            }

            // Kiểm tra đã tồn tại chưa (tránh duplicate)
            const exists = prev.messages.some(
              (m) => m.id === socketMsg.message._id,
            );
            if (exists) {
              return prev;
            }

            const messageType =
              (socketMsg.message.messageType as MessageType) || "TEXT";

            return {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: socketMsg.message._id,
                  chatId: conversationId,
                  senderId: socketMsg.message.senderBy,
                  type: messageType,
                  text: socketMsg.message.content,
                  timestamp: socketMsg.message.createdAt,
                  isMine: socketMsg.message.senderBy === currentUserId,
                  status: "read",

                  fileName: socketMsg.message.fileName,
                  fileSize: socketMsg.message.fileSize,
                  fileMimeType: socketMsg.message.mimeType,
                  mediaUrl: socketMsg.message.mediaUrl,
                  reactions: socketMsg.message.reactions || [],
                },
              ],
            };
          });
        };

        // Handler cho ACK từ server
        const handleAck = (ackData: any) => {
          if (!isMounted) return;

          // console.log("[useChat] ACK received:", {
          //   clientMessageId: ackData.clientMessageId,
          //   messageId: ackData.messageId,
          // });

          // Cập nhật message: thay client ID bằng server ID
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) => {
              if (msg.id === ackData.clientMessageId) {
                return {
                  ...msg,
                  id: ackData.messageId,
                  status: "read",
                };
              }
              return msg;
            }),
          }));
        };

        // Handler cho emoji reactions
        const handleReaction = (reactionData: any) => {
          if (!isMounted) return;

          console.log("[useChat] Reaction received:", {
            messageId: reactionData.messageId,
            emoji: reactionData.emoji,
            action: reactionData.action,
          });

          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) => {
              if (msg.id === reactionData.messageId) {
                return {
                  ...msg,
                  reactions: reactionData.reactions,
                };
              }
              return msg;
            }),
          }));
        };

        // Handler cho message recalled
        const handleRecall = (recallData: any) => {
          if (!isMounted) return;

          console.log("[useChat] Message recalled:", {
            messageId: recallData.messageId,
            revokedBy: recallData.revokedBy,
          });

          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) => {
              if (msg.id === recallData.messageId) {
                return {
                  ...msg,
                  isRecalled: recallData.isRevoked,
                  text: "[Tin nhắn đã bị thu hồi]",
                };
              }
              return msg;
            }),
          }));
        };

        // Handler cho message deleted
        const handleDelete = (deleteData: any) => {
          if (!isMounted) return;

          console.log("[useChat] Message deleted:", {
            messageId: deleteData.messageId,
          });

          setState((prev) => ({
            ...prev,
            messages: prev.messages.filter(
              (msg) => msg.id !== deleteData.messageId,
            ),
          }));
        };

        // Register listeners với socket service
        chatSocketService.onMessage(conversationId, handleNewMessage);
        chatSocketService.onAck(conversationId, handleAck);
        chatSocketService.onReaction(conversationId, handleReaction);
        chatSocketService.onRecall(conversationId, handleRecall);
        chatSocketService.onDelete(conversationId, handleDelete);

        // console.log(
        //   "[useChat] Socket listeners registered for:",
        //   conversationId,
        // );
      } catch (error) {
        if (!isMounted) return;
        console.error("[useChat] Initialization failed:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Khong the tai chat",
          isLoading: false,
        }));
      }
    };

    void initializeChat();

    // Cleanup: leave conversation khi unmount hoặc dependencies thay đổi
    return () => {
      isMounted = false;
      console.log("[useChat] Cleanup: leaving conversation");
      chatSocketService.leaveConversation(conversationId);
    };
  }, [conversationId, currentUserId]);

  // ─────────────────────────────────────────────────────────
  // MESSAGE SENDING
  // ─────────────────────────────────────────────────────────

  /**
   * Gửi tin nhắn
   *
   * Luồng:
   * 1. Tạo tin nhắn local ngay (Optimistic UI) - show ngay cho user
   * 2. Emit qua WebSocket tới server
   * 3. Server lưu vào MongoDB
   * 4. Server emit ACK về client với messageId thật
   * 5. Client cập nhật message ID từ client -> server
   */
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !currentUserId || !conversationId) {
        console.warn("[useChat] Cannot send message:", {
          hasText: !!text.trim(),
          hasUserId: !!currentUserId,
          hasConversationId: !!conversationId,
        });
        return;
      }

      // Tạo ID tạm thời cho client
      const clientMessageId = generateUniqueId();

      // console.log("[useChat] Creating optimistic message:", {
      //   clientMessageId,
      //   content: text.trim(),
      // });

      // Thêm message vào state ngay (Optimistic UI)
      const optimisticMessage: Message = {
        id: clientMessageId,
        chatId: conversationId,
        senderId: currentUserId,
        type: "TEXT",
        text: text.trim(),
        timestamp: new Date().toISOString(),
        isMine: true,
        status: "sending",
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, optimisticMessage],
        inputText: "",
      }));

      //console.log("[useChat] Sending message via WebSocket...");

      // Gửi qua WebSocket với callback
      chatSocketService.sendMessage(
        conversationId,
        text.trim(),
        clientMessageId,
        (ackData) => {
          // console.log("[useChat] sendMessage callback received ACK:", {
          //   clientMessageId,
          //   messageId: ackData.messageId,
          // });

          // Cập nhật message ID từ client thành server ID
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) => {
              if (msg.id === clientMessageId) {
                return {
                  ...msg,
                  id: ackData.messageId,
                  status: "read",
                };
              }
              return msg;
            }),
          }));
        },
      );
    },
    [currentUserId, conversationId],
  );

  const sendAttachment = useCallback(
    async (asset: AttachmentAsset) => {
      if (!currentUserId || !conversationId) {
        console.warn("[useChat] Cannot send attachment");
        return;
      }

      try {
        const mimeType = asset.mimeType ?? "";
        let type: MessageType = "FILE";
        if (mimeType.startsWith("image/")) type = "IMAGE";
        else if (mimeType.startsWith("video/")) type = "VIDEO_PREVIEW";

        const clientMessageId = generateUniqueId();
        const safeFileName = asset.name.replace(/\s+/g, "_");

        const optimisticMessage: Message = {
          id: clientMessageId,
          chatId: conversationId,
          senderId: currentUserId,
          type: type,
          text: safeFileName,
          timestamp: new Date().toISOString(),
          isMine: true,
          status: "sending",
          ...(type === "IMAGE" && { imageUri: asset.uri }),
          ...(type === "VIDEO_PREVIEW" && {
            videoUri: asset.uri,
            videoDuration: asset.duration,
          }),
          ...(type === "FILE" && {
            fileUri: asset.uri,
            fileName: safeFileName,
            fileMimeType: asset.mimeType,
            fileSize: asset.size,
          }),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, optimisticMessage],
        }));

        console.log("[useChat] Uploading attachment to S3");

        const formData = new FormData();
        formData.append("file", {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
        } as any);
        formData.append("conversationId", conversationId);

        // TODO: Test xong thì tách thành API riêng, không upload trực tiếp qua WebSocket
        const uploadData = await chatApi.sendAttachment(formData);
        const mediaUrl = uploadData.mediaUrl || "";

        console.log("[useChat] Upload successful:", { mediaUrl });

        chatSocketService.sendAttachmentMessage(
          conversationId,
          mediaUrl,
          type,
          clientMessageId,
          (ackData) => {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.map((msg) => {
                if (msg.id === clientMessageId) {
                  return {
                    ...msg,
                    id: ackData.messageId,
                    status: "read",
                  };
                }
                return msg;
              }),
            }));
          },
          {
            fileName: asset.name,
            fileSize: asset.size,
            videoDuration: asset.duration,
          },
        );
      } catch (error) {
        console.error("[useChat-sendAttach] Error send attachment ", error);

        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((msg) => {
            if (msg.status === "sending" && msg.text === asset.name) {
              return { ...msg, status: "sent" };
            }
            return msg;
          }),
          error:
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : "Failed to send attachment",
        }));
      }
    },
    [conversationId, currentUserId],
  );

  // ─────────────────────────────────────────────────────────
  // SETTERS
  // ─────────────────────────────────────────────────────────

  const setInputText = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      inputText: text,
    }));
  }, []);

  return {
    messages: state.messages,
    inputText: state.inputText,
    setInputText,
    sendMessage,
    sendAttachment,
    isLoading: state.isLoading,
    error: state.error,
  };
};

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Chuyển đổi format message từ API -> UI
 *
 * Server trả về `senderBy` (UUID của người gửi tin nhắn)
 * Chúng ta cần so sánh `senderBy` với `currentUserId` để xác định nó là tin nhắn của mình hay không
 */
function convertApiMessageToUIMessage(
  apiMsg: MessageItem,
  currentUserId: string,
): Message {
  const messageType = (apiMsg.messageType as MessageType) || "TEXT";

  const baseMessage: Message = {
    id: apiMsg._id,
    chatId: apiMsg.conversationId,
    senderId: apiMsg.senderBy || "",
    type: messageType,
    text: apiMsg.content,
    timestamp: apiMsg.createdAt || "",
    isMine: apiMsg.senderBy === currentUserId,
    status: "read",
    isRecalled: apiMsg.isRevoked || false,
    reactions: apiMsg.reactions || [],
  };

  if (apiMsg.isRevoked) {
    baseMessage.text = "[Tin nhắn đã bị thu hồi]";
  }

  // Set properties dựa trên messageType
  if (messageType === "IMAGE" && apiMsg.mediaUrl) {
    return {
      ...baseMessage,
      imageUri: apiMsg.mediaUrl,
    };
  } else if (messageType === "FILE" && apiMsg.mediaUrl) {
    return {
      ...baseMessage,
      fileUri: apiMsg.mediaUrl,
      fileName: apiMsg.fileName || "File",
      fileMimeType: apiMsg.mimeType,
      fileSize: apiMsg.fileSize,
      text: apiMsg.fileName || "File", //UI sài field này để hiển thị msg
    };
  } else if (messageType === "VIDEO_PREVIEW" && apiMsg.mediaUrl) {
    return {
      ...baseMessage,
      videoUri: apiMsg.mediaUrl,
      videoThumbnailUri: apiMsg.mediaUrl, // tạm thời dùng cùng 1 URL, sau này có thể tách riêng thumbnail
    };
  }

  return baseMessage;
}

/**
 * Format timestamp thành chuoi hien thi
 * Input: ISO string (2025-01-15T14:30:00Z)
 * Output todays: "14:30" | other days: "1/15/25"
 */
export function formatTime(timeString: string): string {
  try {
    const date = new Date(timeString);
    if (Number.isNaN(date.getTime())) {
      return "Invalid time";
    }

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      // Hom nay: hien thi HH:MM
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      // Ngay khac: hien thi M/D/YY
      return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
      });
    }
  } catch {
    return "Invalid time";
  }
}

export function getDiffMinutes(date1: string, date2: string): number {
  const t1 = new Date(date1).getTime();
  const t2 = new Date(date2).getTime();

  return Math.abs(t2 - t1) / (1000 * 60); // ms → phút
}
