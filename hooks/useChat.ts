import { AttachmentAsset, Message, MessageType } from "@/types/chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  chatApi,
  ConversationResponse,
  isConversationUnavailableError,
  MessageItem,
} from "@/services/api/chat";
import {
  chatSocketService,
  SocketMessage,
} from "@/services/websocket/chatSocket";
import { getMessagesCache, saveMessages } from "@/services/cache/chatCache";
import { useAuth } from "./useAuth";
import {
  enqueuePendingTextMessage,
  getPendingTextMessagesByConversation,
  markPendingTextMessageFailed,
  removePendingTextMessage,
  PendingTextMessage,
} from "@/services/cache/pendingMessageQueue";


function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

function getMessageDedupKey(msg: Message): string {
  const time = new Date(msg.timestamp).getTime();

  // gom các tin nhắn lệch nhau dưới 2 giây
  const timeBucket = Number.isNaN(time)
    ? msg.timestamp
    : Math.floor(time / 2000);

  return [msg.chatId, msg.senderId, msg.text, msg.type, timeBucket].join("|");
}

/**
 * Loại bỏ tin nhắn trùng lặp từ một mảng Message, xử lý 2 case:
 *
 * 1. Optimistic UI: Client tạo tin nhắn tạm (chưa có id) -> server trả về bản chính thức (có id).
 *    Cần merge 2 bản này thành 1 thay vì hiển thị trùng.
 *
 * 2. Race condition / re-fetch: Cùng một tin nhắn xuất hiện nhiều lần
 *    trong mảng do gộp nhiều nguồn dữ liệu (socket + API + cache).
 *
 * Chiến lược merge: bản đến sau (msg) ghi đè bản cũ (old),
 * nhưng KHÔNG xóa các field có giá trị của bản cũ (id, senderName, status).
 *
 * @param messages - Mảng tin nhắn có thể chứa bản trùng, thứ tự bất kỳ
 * @returns Mảng tin nhắn đã dedup, sắp xếp tăng dần theo timestamp
 */
function dedupeMessages(messages: Message[]): Message[] {
  const result: Message[] = [];

  for (const msg of messages) {
    const msgTime = new Date(msg.timestamp).getTime();

    const existedIndex = result.findIndex((old) => {
      const oldTime = new Date(old.timestamp).getTime();

      const sameId =
        msg.id && old.id && String(msg.id).trim() === String(old.id).trim();

      const sameContent =
        String(old.chatId).trim() === String(msg.chatId).trim() &&
        String(old.senderId).trim() === String(msg.senderId).trim() &&
        String(old.text).trim() === String(msg.text).trim() &&
        String(old.type).trim() === String(msg.type).trim();

      const closeTime =
        !Number.isNaN(oldTime) &&
        !Number.isNaN(msgTime) &&
        Math.abs(oldTime - msgTime) < 3000;

      return sameId || (sameContent && closeTime);
    });

    if (existedIndex !== -1) {
      result[existedIndex] = {
        ...result[existedIndex],
        ...msg,
        id: msg.id || result[existedIndex].id,
        senderName: msg.senderName || result[existedIndex].senderName,
        status: msg.status || result[existedIndex].status,
      };
    } else {
      result.push(msg);
    }
  }

  return result.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

/**
 * Chuyển đổi PendingTextMessage (local queue) sang định dạng Message (UI).
 *
 * Mục đích: Optimistic UI — hiển thị tin nhắn ngay lập tức trên màn hình
 * trước khi server xác nhận, thay vì chờ response từ socket/API.
 *
 * Luồng sử dụng:
 *   user gửi tin
 *     → lưu vào PendingQueue (AsyncStorage)
 *     → convert sang Message bằng hàm này
 *     → render lên UI ngay
 *     → (nền) gửi lên server
 *     → server ACK → replace bằng Message thật (có server id, timestamp chính xác)
 *
 * @param item - Tin nhắn đang chờ gửi từ local queue
 * @returns Message sẵn sàng để render lên UI
 */
function pendingTextToMessage(item: PendingTextMessage): Message {
  return {
    id: item.clientMessageId,
    chatId: item.conversationId,
    senderId: item.userId,
    type: "TEXT",
    text: item.content,
    timestamp: item.createdAt,
    isMine: true,
    status: item.status === "failed" ? "failed" : "pending",
    replyToMessageId: item.replyToMessageId,
    replyToMessagePreview: item.replyToMessagePreview,
  };
}

function buildParticipantLookup(conversation?: ConversationResponse | null) {
  const namesById: Record<string, string> = {};
  const avatarsById: Record<string, string> = {};

  conversation?.participants?.forEach((participant) => {
    const userId = String(participant.userId || "").trim();
    if (!userId) return;

    const fullName = String(participant.fullName || "").trim();
    if (fullName) {
      namesById[userId] = fullName;
    }

    if (participant.avatarUrl) {
      avatarsById[userId] = participant.avatarUrl;
    }
  });

  return { namesById, avatarsById };
}

function looksLikeId(value?: string, senderId?: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return true;
  if (senderId && normalized === String(senderId).trim()) return true;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    normalized,
  );
}

function resolveSenderName(
  senderId: string,
  rawName?: string,
  namesById: Record<string, string> = {},
) {
  const name = String(rawName || "").trim();
  if (name && !looksLikeId(name, senderId)) {
    return name;
  }

  return namesById[senderId] || (name && !looksLikeId(name) ? name : "Unknown");
}

function buildAttachmentFields(
  messageType: MessageType,
  mediaUrl?: string,
  fileName?: string,
  mimeType?: string,
  fileSize?: number,
): Partial<Message> {
  if (!mediaUrl) return {};

  if (messageType === "IMAGE") {
    return { imageUri: mediaUrl };
  }

  if (messageType === "VIDEO" || messageType === "VIDEO_PREVIEW") {
    return {
      videoUri: mediaUrl,
      fileMimeType: mimeType,
      ...(messageType === "VIDEO_PREVIEW" && {
        videoThumbnailUri: mediaUrl,
      }),
    };
  }

  if (messageType === "FILE") {
    return {
      fileUri: mediaUrl,
      fileName: fileName || "File",
      fileMimeType: mimeType,
      fileSize,
      text: fileName || "File",
    };
  }

  return {};
}

/**
 * Trạng thái của useChat hook
 */
interface UseChatState {
  messages: Message[];
  inputText: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  error: string | null;
  replyToMessage: Message | null;
}

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
    isLoadingMore: false,
    hasMore: true,
    nextCursor: null,
    error: null,
    replyToMessage: null,
  });

  const { state: authState } = useAuth();
  const currentUserId = authState.user?.userId ?? null;



  // /**
  //  * Lấy ID user hiện tại từ AsyncStorage
  //  */
  // useEffect(() => {
  //   let isMounted = true;

  //   setCurrentUserId(null);

  //   const bootstrap = async () => {
  //     // Try to get userId from multiple sources
  //     const candidates = [
  //       await AsyncStorage.getItem("userId"), // Direct userId
  //       await AsyncStorage.getItem("user.id"), // Nested path
  //     ];

  //     // Try parsing stored user objects
  //     try {
  //       const authUserRaw = await AsyncStorage.getItem("auth_user");
  //       if (authUserRaw) {
  //         const parsed = JSON.parse(authUserRaw);
  //         candidates.push(parsed?.userId || parsed?.id);
  //       }
  //     } catch {
  //       // Ignore parse errors
  //     }

  //     try {
  //       const userRaw = await AsyncStorage.getItem("user");
  //       if (userRaw) {
  //         const parsed = JSON.parse(userRaw);
  //         candidates.push(parsed?.userId || parsed?.id);
  //       }
  //     } catch {
  //       // Ignore parse errors
  //     }

  //     // Find first non-empty ID
  //     for (const id of candidates) {
  //       if (id && typeof id === "string" && id.trim().length > 0) {
  //         const normalizedId = String(id).trim();
  //         if (isMounted) {
  //           setCurrentUserId(normalizedId);
  //           return;
  //         }
  //       }
  //     }

  //     // If still no ID found, log a warning
  //     console.warn(
  //       "[useChat] Could not load current user ID from AsyncStorage",
  //     );
  //   };

  //   void bootstrap();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [conversationId]);

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

        const cachedMessages = await getMessagesCache<Message>(
          currentUserId,
          conversationId,
        );

        // Message chờ ở local queue
        const pendingMessages = await getPendingTextMessagesByConversation(
          currentUserId,
          conversationId,
        );

        const mergedCachedMessages = dedupeMessages([
          ...cachedMessages,
          ...pendingMessages.map(pendingTextToMessage),
        ]);

        if (mergedCachedMessages.length > 0 && isMounted) {
          setState((prev) => ({
            ...prev,
            messages: mergedCachedMessages,
            isLoading: false,
            error: null,
          }));
        }

        if (cachedMessages.length > 0 && isMounted) {
          setState((prev) => ({
            ...prev,
            messages: dedupeMessages(cachedMessages),
            isLoading: false,
            error: null,
          }));
        }

        let socketReady = false;

        try {
          if (!chatSocketService.isConnected()) {
            await chatSocketService.connect();
          }

          if (isMounted) {
            chatSocketService.joinConversation(conversationId);
            socketReady = true;
          }
        } catch (socketError) {
          console.warn(
            "[useChat] Socket unavailable, using offline cache",
            socketError,
          );
        }

        let participantLookup = buildParticipantLookup(null);

        try {
          const [messagesResult, conversationResult] = await Promise.allSettled(
            [
              chatApi.getMessages(conversationId, 50, undefined),
              chatApi.getConversation(conversationId).catch(() => null),
            ],
          );

          if (conversationResult.status === "fulfilled") {
            participantLookup = buildParticipantLookup(
              conversationResult.value,
            );
          }

          if (messagesResult.status !== "fulfilled") {
            throw messagesResult.reason;
          }

          if (!isMounted) return;

          const formattedMessages = (messagesResult.value.items || []).map(
            (msg) =>
              convertApiMessageToUIMessage(
                msg,
                currentUserId,
                participantLookup.namesById,
                participantLookup.avatarsById,
              ),
          );

          const sortedMessages = formattedMessages.sort((a, b) => {
            const dateA =
              new Date(
                a.timestamp.includes(":") ? a.timestamp : "",
              ).getTime() || 0;
            const dateB =
              new Date(
                b.timestamp.includes(":") ? b.timestamp : "",
              ).getTime() || 0;
            return dateA - dateB;
          });

          const nextMessages = dedupeMessages([
            ...sortedMessages,
            ...pendingMessages.map(pendingTextToMessage),
          ]);

          if (nextMessages.length > 0) {
            await saveMessages(currentUserId, conversationId, nextMessages);
          }

          if (!isMounted) return;

          setState((prev) => ({
            ...prev,
            messages: nextMessages,
            nextCursor: messagesResult.value.nextCursor || null,
            hasMore: !!messagesResult.value.nextCursor,
            isLoading: false,
            error: null,
          }));
        } catch (apiError) {
          if (isConversationUnavailableError(apiError)) {
            console.log(
              "[useChat] Conversation is no longer available; stopping message load.",
            );

            if (!isMounted) return;

            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: null,
            }));
            return;
          }

          console.warn(
            "[useChat] API unavailable, keeping cached messages",
            apiError,
          );

          if (!isMounted) return;

          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              cachedMessages.length > 0
                ? null
                : "Không thể tải tin nhắn và chưa có dữ liệu offline",
          }));
        }

        if (!socketReady) {
          return;
        }

        // Handler cho tin nhắn mới từ WebSocket
        const handleNewMessage = (socketMsg: SocketMessage) => {
          if (!isMounted) return;

          setState((prev) => {
            const incomingServerId = String(socketMsg.message._id || "").trim();
            const incomingClientId = String(
              socketMsg.message.clientMessageId || "",
            ).trim();

            const senderId = String(socketMsg.message.senderBy || "").trim();
            const currentId = String(currentUserId || "").trim();
            const content = String(socketMsg.message.content || "").trim();
            const createdAt = socketMsg.message.createdAt;

            const exists = prev.messages.some((m) => {
              const sameId =
                incomingServerId && String(m.id).trim() === incomingServerId;

              const sameClientId =
                incomingClientId && String(m.id).trim() === incomingClientId;

              const sameSender = String(m.senderId).trim() === senderId;

              const sameText = String(m.text || "").trim() === content;

              const oldTime = new Date(m.timestamp).getTime();
              const newTime = new Date(createdAt).getTime();

              const closeTime =
                !Number.isNaN(oldTime) &&
                !Number.isNaN(newTime) &&
                Math.abs(oldTime - newTime) < 5000;

              return (
                sameId || sameClientId || (sameSender && sameText && closeTime)
              );
            });

            if (exists) {
              return {
                ...prev,
                messages: prev.messages.map((m) => {
                  const sameId =
                    incomingServerId &&
                    String(m.id).trim() === incomingServerId;
                  const sameClientId =
                    incomingClientId &&
                    String(m.id).trim() === incomingClientId;
                  if (sameId || sameClientId) {
                    return {
                      ...m,
                      id: incomingServerId || m.id,
                      callData: socketMsg.message.callData || m.callData,
                      replyToMessageId:
                        socketMsg.message.replyToMessageId ||
                        m.replyToMessageId ||
                        null,
                      replyToMessagePreview:
                        socketMsg.message.replyToMessagePreview ||
                        m.replyToMessagePreview,
                      status: "read",
                    };
                  }
                  return m;
                }),
              };
            }

            const senderName = resolveSenderName(
              senderId,
              socketMsg.message.senderName,
              participantLookup.namesById,
            );
            const normalizedType = String(
              socketMsg.message.messageType || "TEXT",
            ).toUpperCase() as MessageType;

            const incomingMessage: Message = {
              id: incomingServerId || incomingClientId,
              chatId: conversationId,
              senderId,
              senderName,
              senderAvatar:
                socketMsg.message.senderAvatar ||
                participantLookup.avatarsById[senderId] ||
                undefined,
              type: normalizedType,
              text: socketMsg.message.content,
              timestamp: createdAt,
              isMine: senderId === currentId,
              status: "read",
              reactions: socketMsg.message.reactions || [],
              callData: socketMsg.message.callData,
              ...buildAttachmentFields(
                normalizedType,
                socketMsg.message.mediaUrl,
                socketMsg.message.fileName,
                socketMsg.message.mimeType,
                socketMsg.message.fileSize,
              ),
              replyToMessageId: socketMsg.message.replyToMessageId || null,
              replyToMessagePreview: socketMsg.message.replyToMessagePreview,
            };

            const nextMessages = dedupeMessages([
              ...prev.messages,
              incomingMessage,
            ]);

            void saveMessages(currentUserId, conversationId, nextMessages);

            return {
              ...prev,
              messages: nextMessages,
            };
          });
        };

        // Handler cho ACK từ server
        const handleAck = (ackData: any) => {
          if (!isMounted) return;

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

          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) => {
              if (msg.id === recallData.messageId) {
                // Clear all media URIs when message is recalled
                return {
                  ...msg,
                  isRecalled: true,
                  text: "[Tin nhắn đã bị thu hồi]",
                  videoUri: undefined,
                  imageUri: undefined,
                  fileUri: undefined,
                  linkPreview: undefined,
                };
              }
              return msg;
            }),
          }));
        };

        // Handler cho message deleted
        const handleDelete = (deleteData: any) => {
          if (!isMounted) return;

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

  /**
   * Thử gửi lại một tin nhắn bị lỗi hoặc chưa gửi được.
   * Cập nhật UI optimistically trong qtrinh gửi (sending -> sent/failed).
   *
   * Luồng trạng thái:
   *   "pending"/"failed" -> "sending" -> "read" (thành công) / "failed" (thất bại)
   *
   * @param pending - Tin nhắn cần gửi lại từ local queue
   */
  const resendPendingMessage = useCallback(
    async (pending: PendingTextMessage) => {
      if (!currentUserId || !conversationId) return;
      if (!chatSocketService.isConnected()) return;

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === pending.clientMessageId
            ? { ...msg, status: "sending" }
            : msg,
        ),
      }));

      try {
        const ackData = await chatSocketService.sendMessageAsync(
          pending.conversationId,
          pending.content,
          pending.clientMessageId,
          pending.replyToMessageId,
          { mentions: pending.mentions, mentionAll: pending.mentionAll }
        );

        await removePendingTextMessage(pending.clientMessageId);

        setState((prev) => {
          const nextMessages = prev.messages.map((msg) =>
            msg.id === pending.clientMessageId
              ? {
                  ...msg,
                  id: ackData.messageId,
                  status: "read" as const,
                  timestamp: ackData.timestamp || msg.timestamp,
                }
              : msg,
          );

          void saveMessages(currentUserId, conversationId, nextMessages);

          return {
            ...prev,
            messages: nextMessages,
          };
        });
      } catch (error) {
        await markPendingTextMessageFailed(pending.clientMessageId);

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === pending.clientMessageId
              ? { ...msg, status: "failed" }
              : msg,
          ),
        }));
      }
    },
    [currentUserId, conversationId],
  );

  /**
   * Gửi lại toàn bộ tin nhắn đang chờ trong queue của conversation hiện tại.
   * Gọi khi:
   * - App reconnect sau khi mất mạng
   * - User mở lại conversation có tin nhắn bị lỗi
   * - Socket reconnect thành công
   *
   * Gửi tuần tự (sequential) thay vì song song (parallel) để tránh
   * overwhelm server và giữ đúng thứ tự tin nhắn.
   */
  const flushPendingMessages = useCallback(async () => {
    if (!currentUserId || !conversationId) return;
    if (!chatSocketService.isConnected()) return;

    const pendingMessages = await getPendingTextMessagesByConversation(
      currentUserId,
      conversationId,
    );

    for (const pending of pendingMessages) {
      await resendPendingMessage(pending);
    }
  }, [currentUserId, conversationId, resendPendingMessage]);

  useEffect(() => {
    if (!currentUserId || !conversationId) return;

    chatSocketService.onConnected(flushPendingMessages);
    void flushPendingMessages();

    return () => {
      chatSocketService.offConnected(flushPendingMessages);
    };
  }, [currentUserId, conversationId, flushPendingMessages]);

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
    async (
      text: string,
      options?: { mentions?: string[]; mentionAll?: boolean }
    ) => {
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

      const replyToMessage = state.replyToMessage;
      // console.log("[useChat-sendMessage] replyToMessage", {
      //   id: replyToMessage?.id,
      //   text: replyToMessage?.text,
      //   senderName: replyToMessage?.senderName,
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
        // Thông tin reply (nếu có)
        replyToMessageId: replyToMessage?.id ?? null,
        replyToMessagePreview: replyToMessage
          ? {
              messageId: replyToMessage.id,
              senderName:
                replyToMessage.senderName ||
                (replyToMessage.isMine ? "Bạn" : "Unknown"),
              content:
                replyToMessage.text || replyToMessage.fileName || "Attachment",
              snippet:
                replyToMessage.text || replyToMessage.fileName || "Attachment",
              createdAt: replyToMessage.timestamp,
            }
          : undefined,
        mentions: options?.mentions,
        mentionAll: options?.mentionAll,
      };

      const pendingItem: PendingTextMessage = {
        clientMessageId,
        conversationId,
        userId: currentUserId,
        content: text.trim(),
        createdAt: optimisticMessage.timestamp,
        retryCount: 0,
        status: chatSocketService.isConnected()
          ? ("sending" as const)
          : ("pending" as const),
        replyToMessageId: replyToMessage?.id ?? null,
        replyToMessagePreview: optimisticMessage.replyToMessagePreview,
        mentions: options?.mentions,
        mentionAll: options?.mentionAll,
      };

      await enqueuePendingTextMessage(pendingItem);

      setState((prev) => {
        const nextMessages = [
          ...prev.messages,
          {
            ...optimisticMessage,
            status: chatSocketService.isConnected()
              ? ("sending" as const)
              : ("pending" as const),
          },
        ];

        void saveMessages(currentUserId, conversationId, nextMessages);

        return {
          ...prev,
          messages: nextMessages,
          inputText: "",
          replyToMessage: null,
        };
      });

      // setState((prev) => ({
      //   ...prev,
      //   messages: [...prev.messages, optimisticMessage],
      //   inputText: "",
      // }));

      //console.log("[useChat] Sending message via WebSocket...");

      // Gửi qua WebSocket với callback
      // chatSocketService.sendMessage(
      //   conversationId,
      //   text.trim(),
      //   clientMessageId,
      //   (ackData) => {
      //     // console.log("[useChat] sendMessage callback received ACK:", {
      //     //   clientMessageId,
      //     //   messageId: ackData.messageId,
      //     // });

      //     // Cập nhật message ID từ client thành server ID
      //     setState((prev) => ({
      //       ...prev,
      //       messages: prev.messages.map((msg) => {
      //         if (msg.id === clientMessageId) {
      //           return {
      //             ...msg,
      //             id: ackData.messageId,
      //             status: "read",
      //           };
      //         }
      //         return msg;
      //       }),
      //     }));
      //   },
      // );

      if (!chatSocketService.isConnected()) {
        return;
      }

      await resendPendingMessage(pendingItem);
    },
    [currentUserId, conversationId, state.replyToMessage, resendPendingMessage],
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
        else if (mimeType.startsWith("video/")) type = "VIDEO";

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
          ...(type === "VIDEO" && {
            videoUri: asset.uri,
            videoDuration: asset.duration,
            fileMimeType: asset.mimeType,
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
                    ...buildAttachmentFields(
                      type,
                      mediaUrl,
                      asset.name,
                      asset.mimeType,
                      asset.size,
                    ),
                  };
                }
                return msg;
              }),
            }));
          },
          {
            fileName: asset.name,
            fileSize: asset.size,
            mimeType: asset.mimeType,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, currentUserId, flushPendingMessages],
  );

  // // ─────────────────────────────────────────────────────────
  // // PAGINATION
  // // ─────────────────────────────────────────────────────────

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !currentUserId || state.isLoadingMore || !state.hasMore || !state.nextCursor) return;

    try {
      setState((prev) => ({ ...prev, isLoadingMore: true, error: null }));

      let participantLookup = buildParticipantLookup(null);
      const [messagesResult, conversationResult] = await Promise.allSettled([
        chatApi.getMessages(conversationId, 50, state.nextCursor),
        chatApi.getConversation(conversationId).catch(() => null),
      ]);

      if (conversationResult.status === "fulfilled") {
        participantLookup = buildParticipantLookup(conversationResult.value);
      }

      if (messagesResult.status !== "fulfilled") {
        throw messagesResult.reason;
      }

      const formattedMessages = (messagesResult.value.items || []).map((msg) =>
        convertApiMessageToUIMessage(
          msg,
          currentUserId,
          participantLookup.namesById,
          participantLookup.avatarsById,
        ),
      );

      const sortedMessages = formattedMessages.sort((a, b) => {
        const dateA = new Date(a.timestamp.includes(":") ? a.timestamp : "").getTime() || 0;
        const dateB = new Date(b.timestamp.includes(":") ? b.timestamp : "").getTime() || 0;
        return dateA - dateB;
      });

      setState((prev) => {
        const nextMessages = dedupeMessages([...sortedMessages, ...prev.messages]);
        
        void saveMessages(currentUserId, conversationId, nextMessages);

        return {
          ...prev,
          messages: nextMessages,
          nextCursor: messagesResult.value.nextCursor || null,
          hasMore: !!messagesResult.value.nextCursor,
          isLoadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      console.warn("[useChat] loadMoreMessages failed:", error);
      setState((prev) => ({
        ...prev,
        isLoadingMore: false,
        error: error instanceof Error ? error.message : "Failed to load more messages",
      }));
    }
  }, [conversationId, currentUserId, state.isLoadingMore, state.hasMore, state.nextCursor]);

  // ─────────────────────────────────────────────────────────
  // SETTERS
  // ─────────────────────────────────────────────────────────

  const setInputText = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      inputText: text,
    }));
  }, []);

  const setReplyToMessage = useCallback((message: Message) => {
    setState((prev) => ({
      ...prev,
      replyToMessage: message,
    }));
  }, []);

  const clearReplyToMessage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      replyToMessage: null,
    }));
  }, []);

  return {
    messages: state.messages,
    inputText: state.inputText,
    replyToMessage: state.replyToMessage,
    setInputText,
    setReplyToMessage,
    clearReplyToMessage,
    sendMessage,
    sendAttachment,
    loadMoreMessages,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    hasMore: state.hasMore,
    error: state.error,
  };
};

/**
 * Chuyển đổi format message từ API -> UI
 *
 * Server trả về `senderBy` (UUID của người gửi tin nhắn)
 * Chúng ta cần so sánh `senderBy` với `currentUserId` để xác định nó là tin nhắn của mình hay không
 */
function convertApiMessageToUIMessage(
  apiMsg: MessageItem,
  currentUserId: string,
  namesById: Record<string, string> = {},
  avatarsById: Record<string, string> = {},
): Message {
  // Normalize messageType to uppercase for consistency with MessageType enum
  const normalizedType = String(apiMsg.messageType || "TEXT").toUpperCase();
  const messageType = (normalizedType as MessageType) || "TEXT";

  // Normalize sender ID for comparison
  const senderId = String(apiMsg.senderBy || "").trim();
  const userId = String(currentUserId || "").trim();

  // Debug log to check if comparison works
  const isMine = senderId === userId;

  const resolvedId =
    apiMsg._id ||
    (apiMsg as { id?: string }).id ||
    apiMsg.clientMessageId ||
    `${senderId}-${apiMsg.createdAt || Date.now()}`;

  const baseMessage: Message = {
    id: resolvedId,
    chatId: apiMsg.conversationId,
    senderId: senderId,
    senderName: resolveSenderName(senderId, apiMsg.senderName, namesById),
    senderAvatar: apiMsg.senderAvatar || avatarsById[senderId] || undefined,
    type: messageType,
    text: apiMsg.content,
    timestamp: apiMsg.createdAt || "",
    isMine: isMine,
    status: "read",
    isRecalled: apiMsg.isRevoked || false,
    isPinned: !!apiMsg.isPinned,
    pinnedAt: apiMsg.pinnedAt || null,
    reactions: apiMsg.reactions || [],
    replyToMessageId: apiMsg.replyToMessageId || null,
    replyToMessagePreview: apiMsg.replyToMessagePreview,
  };

  if (apiMsg.isRevoked) {
    baseMessage.text = "[Tin nhắn đã bị thu hồi]";
    // Return early with no media URIs when message is recalled
    return baseMessage;
  }

  // Set properties dựa trên messageType (uppercase)
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
  } else if (messageType === "VIDEO" && apiMsg.mediaUrl) {
    console.log("[convertApiMessage] VIDEO message:", {
      messageId: apiMsg._id,
      mediaUrl: apiMsg.mediaUrl,
      fileName: apiMsg.fileName,
    });
    return {
      ...baseMessage,
      videoUri: apiMsg.mediaUrl,
      videoDuration: undefined, // Duration not available from API
      text: apiMsg.fileName || "Video",
    };
  } else if (messageType === "VIDEO_PREVIEW" && apiMsg.mediaUrl) {
    return {
      ...baseMessage,
      videoUri: apiMsg.mediaUrl,
      videoThumbnailUri: apiMsg.mediaUrl, // tạm thời dùng cùng 1 URL, sau này có thể tách riêng thumbnail
    };
  } else if (messageType === "CALL") {
    return {
      ...baseMessage,
      callData: apiMsg.callData,
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
