import ChatListItem from "@/components/chat/ChatListItem";
import ChatSearchBar from "@/components/chat/ChatSearchBar";
import ChatTabFilter, { ChatTab } from "@/components/chat/ChatTabFilter";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import AddFriendsModal from "@/components/chat/AddFriendsModal";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useGroupCreation } from "@/hooks/useGroupCreation";
import { ChatItem } from "@/types/chat";
import { chatApi, ConversationResponse } from "@/services/api/chat";
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNotificationContext } from "@/context/NotificationContext";
import {
  FlatList,
  StatusBar,
  View,
  ActivityIndicator,
  Text,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import {
  getConversationsCache,
  saveMessages,
  saveConversationsToCache,
} from "@/services/cache/chatCache";
import {
  chatSocketService,
  SocketMessage,
} from "@/services/websocket/chatSocket";
import { formatTime } from "@/hooks/useChat";
import { isSessionExpiredError } from "@/services/auth/sessionEvents";
import { removePendingTextMessagesByConversation } from "@/services/cache/pendingMessageQueue";

/**
 * Trích xuất text preview cho tin nhắn cuối cùng giống như trên Web
 */
const getLastMessageSenderId = (lastMessage: any): string =>
  String(
    lastMessage?.senderId ||
      lastMessage?.senderBy ||
      lastMessage?.senderById ||
      "",
  ).trim();

const getParticipantNameById = (
  participants: ConversationResponse["participants"] | undefined,
  senderId: string,
): string | undefined =>
  participants?.find((p) => String(p.userId).trim() === senderId)?.fullName;

const getLastMessagePreview = (
  lastMessage: any,
  currentUserId?: string,
  options?: {
    isGroup?: boolean;
    participants?: ConversationResponse["participants"];
  },
): string => {
  if (!lastMessage) return "No messages yet";

  const isGroup = !!options?.isGroup;
  const senderId = getLastMessageSenderId(lastMessage);
  const isMine = !!currentUserId && senderId === String(currentUserId).trim();

  const senderName =
    lastMessage.senderName ||
    getParticipantNameById(options?.participants, senderId) ||
    "Unknown";

  const prefix = isGroup
    ? `${isMine ? "You" : senderName}: `
    : isMine
      ? "You: "
      : "";

  const { content, messageType, type, isRecalled, callData } = lastMessage;

  if (isRecalled || content === "Message was recalled") {
    return `${prefix}Message was recalled`;
  }

  const typeStr = String(messageType || type || "").toUpperCase();

  switch (typeStr) {
    case "TEXT":
      return prefix + (content || "No messages yet");
    case "LINK":
      return `${prefix}Sent a link`;
    case "STICKER":
      return `${prefix}Sent a sticker`;
    case "VOICE":
      return `${prefix}Sent a voice message`;
    case "IMAGE":
      return `${prefix}Photo`;
    case "FILE":
      return `${prefix}Attachment`;
    case "VIDEO":
      return `${prefix}Video`;
  }

  if (typeStr === "CALL" || !!callData) {
    const callStatus = callData?.callStatus || "completed";
    const callType = callData?.callType || "audio";
    const callTypeLabel = callType === "video" ? "video" : "voice";

    if (callStatus === "completed") {
      return `${prefix}${isMine ? "Outgoing" : "Incoming"} ${callTypeLabel} call`;
    }
    if (callStatus === "missed") {
      return `${prefix}${isMine ? "Canceled call" : "Missed call"}`;
    }
    if (callStatus === "declined") {
      return `${prefix}${isMine ? "Recipient declined" : "You declined"}`;
    }
    if (callStatus === "active") {
      return `${prefix}Ongoing group call`;
    }
    return `${prefix}${callType === "video" ? "Video call" : "Voice call"}`;
  }

  return `${prefix}${content || "No messages yet"}`;
};

/**
 * Chuyển đổi ConversationResponse thành ChatItem
 */
const convertConversationToChatItem = (
  conversation: ConversationResponse,
  currentUserId?: string,
  unreadByConversation: Record<string, number> = {},
): ChatItem => {
  const lastMessage = conversation.lastMessage;

  const isGroup = conversation.type === "GROUP";

  // Lấy thông tin người dùng khác (cho private chat)
  const otherParticipant = !isGroup
    ? conversation.participants.find((p: any) => p.userId !== currentUserId) ||
      conversation.participants.find(
        (p: any) => p.userId !== conversation.participants[0]?.userId,
      )
    : null;

  // Xác định tên hiển thị
  const name = isGroup
    ? conversation.groupInfo?.groupName || "Group"
    : otherParticipant?.fullName || "Unknown";

  // Xác định avatars
  const avatarUri = !isGroup
    ? otherParticipant?.avatarUrl
    : conversation.groupInfo?.groupAvatar;

  const avatarUris = isGroup
    ? conversation.participants
        .slice(0, 3)
        .map((p: any) => p.avatarUrl)
        .filter(Boolean)
    : undefined;

  // Format thời gian tin nhắn cuối cùng
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";

    const msgDate = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDay = new Date(
      msgDate.getFullYear(),
      msgDate.getMonth(),
      msgDate.getDate(),
    );

    if (msgDay.getTime() === today.getTime()) {
      return msgDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (msgDay.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else if (now.getFullYear() === msgDate.getFullYear()) {
      return msgDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
      });
    } else {
      return msgDate.toLocaleDateString("en-US");
    }
  };

  // Để sort last msg
  const lastMessageAt =
    lastMessage?.createdAt ||
    lastMessage?.timestamp ||
    conversation.createdAt ||
    "";

  return {
    id: conversation.conversationId,
    name,
    lastMessage: getLastMessagePreview(lastMessage, currentUserId, {
      isGroup,
      participants: conversation.participants,
    }),
    time: formatTime(lastMessage?.createdAt || lastMessage?.timestamp),
    lastMessageAt,
    unread: unreadByConversation[conversation.conversationId] || 0,
    isGroup,
    isMuted: conversation.myIsHidden || false,
    isPinned: conversation.myIsPinned || false,
    pinnedAt: conversation.myPinnedAt || undefined,
    isSentByMe:
      !!currentUserId &&
      getLastMessageSenderId(lastMessage) === String(currentUserId).trim(),
    isRead: true,
    avatarUri,
    avatarUris,
    otherUserId: otherParticipant?.userId || undefined,
    participantIds: conversation.participants
      .map((p: any) => p.userId)
      .filter(Boolean),
  };
};

/**
 * Sort ChatItem theo lastMessageAt (mới nhất trước), ghim lên đầu. Nếu cùng ghim thì sort theo pinnedAt.
 */
const sortChatItems = (items: ChatItem[]) => {
  return [...items].sort((a, b) => {
    if (!!a.isPinned !== !!b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    if (a.isPinned && b.isPinned) {
      return (
        new Date(b.pinnedAt || 0).getTime() -
        new Date(a.pinnedAt || 0).getTime()
      );
    }

    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

    return timeB - timeA;
  });
};

/**
 * Gom logic dedupe, map. sort vào cùng 1 chỗ (cả API, cache)
 */
const buildSortedChatItems = (
  data: ConversationResponse[],
  currentUserId: string | undefined,
  unreadByConversation: Record<string, number>,
): ChatItem[] => {
  const visibleData = data.filter((conversation) => {
    if (conversation.type !== "PRIVATE") return true;
    const blockStatus = conversation.blockStatus || {};
    return !(
      conversation.myIsBlocked ||
      blockStatus?.isBlocked ||
      blockStatus?.iAmBlocked ||
      blockStatus?.iAmTheBlocker
    );
  });

  const uniqueConversations = new Map<string, ConversationResponse>();

  visibleData.forEach((conv) => {
    if (!uniqueConversations.has(conv.conversationId)) {
      uniqueConversations.set(conv.conversationId, conv);
    }
  });

  const chatItems = Array.from(uniqueConversations.values()).map(
    (conversation) =>
      convertConversationToChatItem(
        conversation,
        currentUserId,
        unreadByConversation,
      ),
  );

  return sortChatItems(chatItems);
};

export default function ChatsScreen() {
  const { colors, colorScheme } = useTheme();
  const { state: authState } = useAuth();
  const router = useRouter();
  const { unreadByConversation } = useNotificationContext();
  const { modalVisible, openModal, closeModal, handleGroupCreated } =
    useGroupCreation();
  const [addFriendsVisible, setAddFriendsVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ChatTab>("all");
  const [conversations, setConversations] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const openedSwipeableRef = useRef<Swipeable | null>(null);
  const unreadRef = useRef(unreadByConversation);

  useEffect(() => {
    unreadRef.current = unreadByConversation;
  }, [unreadByConversation]);

  const loadConversations = useCallback(async () => {
    if (!authState.user?.userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await chatApi.getConversations(
        authState.user!.userId,
        20,
        0,
      );

      await saveConversationsToCache(authState.user!.userId, data);

      const sortedItems = buildSortedChatItems(
        data,
        authState.user?.userId,
        unreadRef.current,
      );

      // Chuyển logic lên func buildSortedChatItems ở trên để tái sử dụng cho cả API và cache
      // Deduplicate conversations by ID (prevent duplicates from backend or polling)
      //   const uniqueConversations = new Map<string, any>();
      //   data.forEach((conv) => {
      //     if (!uniqueConversations.has(conv.conversationId)) {
      //       uniqueConversations.set(conv.conversationId, conv);
      //     }
      //   });
      //   const chatItems = Array.from(uniqueConversations.values()).map(
      //     (conversation) =>
      //       convertConversationToChatItem(
      //         conversation,
      //         authState.user?.userId,
      //         unreadByConversation,
      //       ),
      //   );

      //   // SORT: pinned conversations first, then latest message first
      //   const sortedItems = chatItems.sort((a, b) => {
      //     if (!!a.isPinned !== !!b.isPinned) {
      //       return a.isPinned ? -1 : 1;
      //     }

      //     if (a.isPinned && b.isPinned) {
      //       return (
      //         new Date(b.pinnedAt || 0).getTime() -
      //         new Date(a.pinnedAt || 0).getTime()
      //       );
      //     }

      //     const timeA = a.time ? new Date(a.time).getTime() : 0;
      //     const timeB = b.time ? new Date(b.time).getTime() : 0;
      //     return timeB - timeA; // Newest first
      //   });

      setConversations(sortedItems);
      setLoading(false);
    } catch (err) {
      if (isSessionExpiredError(err)) {
        console.log(
          "Session expired while loading conversations. Waiting for user confirmation.",
        );
        setError(null);
        setLoading(false);
        return;
      }

      console.error("Error loading conversations:", err);

      // Load cache nếu có khi API call thất bại
      const cachedConversations =
        await getConversationsCache<ConversationResponse>(
          authState.user!.userId,
        );

      if (cachedConversations.length > 0) {
        const cachedItems = buildSortedChatItems(
          cachedConversations,
          authState.user?.userId,
          unreadByConversation,
        );

        setConversations(cachedItems);
        setError(null);
        setLoading(false);
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to load conversations";
      setError(errorMessage);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authState.user,
    //, unreadByConversation
  ]);

  // Load khi component mount
  useEffect(() => {
    if (!authState.user?.userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    loadConversations();
  }, [authState.user?.userId, loadConversations]);

  // Polling: Refetch mỗi 5 giây
  useEffect(() => {
    if (!authState.user?.userId) return;

    const interval = setInterval(() => {
      loadConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [authState.user?.userId, loadConversations]);

  // Refetch khi app gain focus
  useFocusEffect(
    useCallback(() => {
      if (authState.user?.userId) {
        loadConversations();
      }
    }, [authState.user?.userId, loadConversations]),
  );

  // Listen real-time updates từ WebSocket
  useEffect(() => {
    if (!authState.user?.userId) return;

    const handleAnyMessage = (socketMsg: SocketMessage) => {
      const msg = socketMsg.message;
      const messageTime = msg.createdAt || new Date().toISOString();

      setConversations((prev) => {
        const exists = prev.some(
          (item) => item.id === socketMsg.conversationId,
        );

        if (!exists) {
          void loadConversations();
          return prev;
        }

        return sortChatItems(
          prev.map((item) =>
            item.id === socketMsg.conversationId
              ? {
                  ...item,
                  lastMessage: getLastMessagePreview(
                    {
                      content: msg.content,
                      createdAt: messageTime,
                      senderId: msg.senderBy,
                      senderName: msg.senderName,
                      messageType: msg.messageType,
                      messageStatus: msg.messageStatus,
                      callData: msg.callData,
                    },
                    authState.user?.userId,
                    {
                      isGroup: item.isGroup,
                    },
                  ),
                  time: formatTime(messageTime),
                  lastMessageAt: messageTime,
                  isSentByMe: msg.senderBy === authState.user?.userId,
                }
              : item,
          ),
        );
      });
    };

    chatSocketService.onAnyMessage(handleAnyMessage);

    return () => {
      chatSocketService.offAnyMessage(handleAnyMessage);
    };
  }, [authState.user?.userId, loadConversations]);

  const filteredChats = useMemo(() => {
    let list = conversations;

    if (activeTab === "unread") {
      list = list.filter((c) => c.unread > 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q),
      );
    }

    return list;
  }, [search, activeTab, conversations]);

  const handleTogglePinConversation = useCallback(
    async (item: ChatItem) => {
      const nextPinned = !item.isPinned;
      const nextPinnedAt = nextPinned ? new Date().toISOString() : undefined;

      setConversations((prev) =>
        sortChatItems(
          prev.map((conversation) =>
            conversation.id === item.id
              ? {
                  ...conversation,
                  isPinned: nextPinned,
                  pinnedAt: nextPinnedAt,
                }
              : conversation,
          ),
        ),
      );

      try {
        if (nextPinned) {
          await chatApi.pinConversation(item.id);
        } else {
          await chatApi.unpinConversation(item.id);
        }
        await loadConversations();
      } catch (err) {
        Alert.alert(
          "Could not update pin",
          err instanceof Error ? err.message : "Please try again later",
        );
        await loadConversations();
      }
    },
    [loadConversations],
  );

  const handleClearConversationHistory = useCallback(
    (item: ChatItem) => {
      Alert.alert("Clear History", `Clear conversation history with ${item.name}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await chatApi.clearConversationHistory(item.id);
              if (authState.user?.userId) {
                await Promise.all([
                  saveMessages(authState.user.userId, item.id, []),
                  removePendingTextMessagesByConversation(
                    authState.user.userId,
                    item.id,
                  ),
                ]);
              }
              await loadConversations();
            } catch (err) {
              Alert.alert(
                "Could not clear history",
                err instanceof Error ? err.message : "Please try again later",
              );
            }
          },
        },
      ]);
    },
    [authState.user?.userId, loadConversations],
  );

  const handleDeleteConversation = useCallback((item: ChatItem) => {
    Alert.alert("Delete Conversation", `Delete conversation with ${item.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await chatApi.deleteConversation(item.id);
            setConversations((prev) =>
              prev.filter((conversation) => conversation.id !== item.id),
            );
          } catch (err) {
            Alert.alert(
              "Could not delete",
              err instanceof Error ? err.message : "Please try again later",
            );
          }
        },
      },
    ]);
  }, []);

  const handleSwipeOpen = useCallback((_: string, ref: Swipeable | null) => {
    if (openedSwipeableRef.current && openedSwipeableRef.current !== ref) {
      openedSwipeableRef.current.close();
    }
    openedSwipeableRef.current = ref;
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={[]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Search bar with QR + menu */}
      <ChatSearchBar
        value={search}
        onChangeText={setSearch}
        onCreateGroupPress={openModal}
        onAddFriendsPress={() => setAddFriendsVisible(true)}
        onQrScanPress={() => router.push("/qr-scan")}
      />

      {/* Tab filter */}
      <ChatTabFilter activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Loading state */}
      {loading && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              color: colors.error,
              textAlign: "center",
              fontSize: 16,
            }}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && filteredChats.length === 0 && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16 }}>
            {search ? "No conversations found" : "No conversations yet"}
          </Text>
        </View>
      )}

      {/* Chat list */}
      {!loading && !error && filteredChats.length > 0 && (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              item={item}
              onTogglePin={handleTogglePinConversation}
              onClearHistory={handleClearConversationHistory}
              onDelete={handleDeleteConversation}
              onSwipeOpen={handleSwipeOpen}
            />
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 0.5,
                marginLeft: 80,
                backgroundColor: colors.divider,
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={modalVisible}
        onClose={closeModal}
        onGroupCreated={handleGroupCreated}
      />
      <AddFriendsModal
        visible={addFriendsVisible}
        currentUserId={authState.user?.userId}
        onClose={() => setAddFriendsVisible(false)}
      />
    </SafeAreaView>
  );
}
