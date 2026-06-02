import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import MessageTimestamp from "@/components/chat/MessageTimestamp";
import MessageActionMenu from "@/components/chat/MessageActionMenu";
import ImageViewerModal from "@/components/chat/ImageViewerModal";
import ConversationInfoModal from "@/components/chat/ConversationInfoModal";
import { formatTime, getDiffMinutes, useChat } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { AttachmentAsset, Message } from "@/types/chat";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
  Alert,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ForwardConversationModal from "@/components/chat/ForwardConversationModal";
import { generateUniqueId } from "@/utils/generateUniqueId";
import {
  chatApi,
  PinnedMessageItem,
  isConversationUnavailableError,
} from "@/services/api/chat";
import { friendApi } from "@/services/api/friend";
import { useNotificationContext } from "@/context/NotificationContext";
import { useFocusEffect } from "expo-router";
import { CallContext } from "@/context/CallContext";
import { GroupCallContext } from "@/context/GroupCallContext";
import { useAuth } from "@/hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const IMAGE_GROUP_WINDOW_MS = 1 * 60 * 1000; // gom ảnh trong 1 phút

type ChatMessageListItem =
  | {
      kind: "message";
      id: string;
      message: Message;
    }
  | {
      kind: "imageGroup";
      id: string;
      messages: Message[];
    };

type PrivateBlockStatus = {
  isBlocked: boolean;
  iAmBlocked: boolean;
  iAmTheBlocker: boolean;
};

const EMPTY_PRIVATE_BLOCK_STATUS: PrivateBlockStatus = {
  isBlocked: false,
  iAmBlocked: false,
  iAmTheBlocker: false,
};

function getMessageTime(message: Message): number {
  const time = new Date(message.timestamp).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getItemFirstMessage(item: ChatMessageListItem): Message {
  return item.kind === "imageGroup" ? item.messages[0] : item.message;
}

function getItemLastMessage(item: ChatMessageListItem): Message {
  return item.kind === "imageGroup"
    ? item.messages[item.messages.length - 1]
    : item.message;
}

function canGroupImageMessage(message: Message): boolean {
  return false;
}

function isSameImageGroup(first: Message, candidate: Message): boolean {
  return (
    canGroupImageMessage(candidate) &&
    first.senderId === candidate.senderId &&
    first.isMine === candidate.isMine &&
    Math.abs(getMessageTime(candidate) - getMessageTime(first)) <=
      IMAGE_GROUP_WINDOW_MS
  );
}

function buildMessageListItems(messages: Message[]): ChatMessageListItem[] {
  const items: ChatMessageListItem[] = [];
  let index = 0;

  while (index < messages.length) {
    const current = messages[index];

    if (!canGroupImageMessage(current)) {
      items.push({
        kind: "message",
        id: current.id,
        message: current,
      });
      index += 1;
      continue;
    }

    const group = [current];
    let nextIndex = index + 1;

    while (
      nextIndex < messages.length &&
      isSameImageGroup(current, messages[nextIndex])
    ) {
      group.push(messages[nextIndex]);
      nextIndex += 1;
    }

    if (group.length > 1) {
      items.push({
        kind: "imageGroup",
        id: `image-group-${group.map((message) => message.id).join("-")}`,
        messages: group,
      });
    } else {
      items.push({
        kind: "message",
        id: current.id,
        message: current,
      });
    }

    index = nextIndex;
  }

  return items;
}

function shouldShowAvatar(
  items: ChatMessageListItem[],
  index: number,
): boolean {
  const curr = getItemFirstMessage(items[index]);

  // Don't show avatar for sent messages
  if (curr.isMine) return false;

  // Get previous message to check if sender changed
  const prevItem = items[index - 1];
  const prev = prevItem ? getItemLastMessage(prevItem) : undefined;

  // Show avatar if:
  // 1. This is the first received message, OR
  // 2. Previous message was sent by different person OR sent by current user
  if (!prev) return true; // First message
  if (prev.isMine) return true; // Previous was sent by user
  if (curr.senderId !== prev.senderId) return true; // Sender changed

  return false; // Sender same as previous, hide avatar
}

function shouldShowSenderName(
  items: ChatMessageListItem[],
  index: number,
): boolean {
  const curr = getItemFirstMessage(items[index]);
  if (curr.isMine) return false;

  const prevItem = items[index - 1];
  const prev = prevItem ? getItemLastMessage(prevItem) : undefined;
  if (!prev) return true;
  if (prev.isMine) return true;

  return curr.senderId !== prev.senderId;
}

function toUserIdList(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return record.userId || record.id || record._id;
        }
        return null;
      })
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getNestedValue(source: any, path: string) {
  return path.split(".").reduce((current, key) => current?.[key], source);
}

function getBlockedFriendId(friend: any) {
  const candidate =
    friend?.userId ||
    friend?.friendId ||
    friend?.blockedUserId ||
    friend?.blockedId ||
    friend?.id ||
    friend?._id ||
    friend?.blockedUser?.userId ||
    friend?.blockedUser?.id ||
    friend?.friend?.userId ||
    friend?.friend?.id ||
    friend?.user?.userId ||
    friend?.user?.id;

  return String(candidate || "").trim();
}

function getBlockedFriendName(friend: any) {
  const candidate =
    friend?.fullName ||
    friend?.name ||
    friend?.displayName ||
    friend?.blockedUser?.fullName ||
    friend?.blockedUser?.name ||
    friend?.friend?.fullName ||
    friend?.friend?.name ||
    friend?.user?.fullName ||
    friend?.user?.name;

  return String(candidate || "").trim();
}

function getGroupBlockedParticipantIds(
  conversation: any,
  currentUserId?: string,
) {
  const candidatePaths = [
    "myBlockedBy",
    "blockedUserIds",
    "blockedUsers",
    "usersIBlocked",
    "iBlockedUserIds",
    "blockStatus.myBlockedBy",
    "blockStatus.blockedUserIds",
    "blockStatus.blockedUsers",
    "blockStatus.usersIBlocked",
    "blockStatus.iBlockedUserIds",
  ];

  const blockedIds = candidatePaths.flatMap((path) =>
    toUserIdList(getNestedValue(conversation, path)),
  );

  return Array.from(new Set(blockedIds)).filter(
    (userId) => userId && userId !== currentUserId,
  );
}

function getParticipantNamesByIds(participants: any[] = [], userIds: string[]) {
  const namesById = new Map(
    participants
      .map(
        (participant) =>
          [
            String(participant.userId || "").trim(),
            String(participant.fullName || "").trim(),
          ] as const,
      )
      .filter(([userId]) => Boolean(userId)),
  );

  return userIds
    .map((userId) => namesById.get(userId) || `User ${userId}`)
    .filter(Boolean);
}

function getGroupParticipantBlockedFriends(
  participants: any[] = [],
  blockedFriends: any[],
  currentUserId?: string,
) {
  const participantIds = new Set(
    participants
      .map((participant) => String(participant.userId || "").trim())
      .filter((userId) => Boolean(userId) && userId !== currentUserId),
  );

  return blockedFriends.filter((friend) => {
    const blockedFriendId = getBlockedFriendId(friend);
    return blockedFriendId && participantIds.has(blockedFriendId);
  });
}

function buildPrivateBlockStatus(
  conversation?: any,
  blockStatus?: any,
): PrivateBlockStatus {
  const sourceStatus = blockStatus || conversation?.blockStatus || {};
  const iAmTheBlocker = Boolean(
    sourceStatus.iAmTheBlocker ||
    sourceStatus.canUnblock ||
    conversation?.canUnblock,
  );
  const iAmBlocked = Boolean(sourceStatus.iAmBlocked);
  const isBlocked = Boolean(
    sourceStatus.isBlocked ||
    conversation?.myIsBlocked ||
    conversation?.blockStatus?.isBlocked ||
    iAmTheBlocker ||
    iAmBlocked,
  );

  return {
    isBlocked,
    iAmBlocked,
    iAmTheBlocker,
  };
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    avatarUri?: string;
    otherUserId?: string;
    isGroup?: string;
    participantIds?: string;
  }>();
  const id = params.id;

  const router = useRouter();
  const { state: authState } = useAuth();

  const initialIsGroup = params.isGroup === "true";
  const initialParticipantIds = (params.participantIds || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const initialOtherUserId = params.otherUserId || undefined;

  const [convDetails, setConvDetails] = useState<{
    isGroup: boolean;
    participantIds: string[];
    otherUserId?: string;
    name: string;
    avatarUri?: string;
    participants?: any[];
  }>({
    isGroup: initialIsGroup,
    participantIds: initialParticipantIds,
    otherUserId: initialOtherUserId,
    name: params.name || "Chat",
    avatarUri: params.avatarUri || undefined,
    participants: [],
  });

  const { isGroup, participantIds, otherUserId, name, avatarUri } = convDetails;
  const [privateBlockStatus, setPrivateBlockStatus] =
    useState<PrivateBlockStatus>(EMPTY_PRIVATE_BLOCK_STATUS);
  const [groupBlockedParticipantNames, setGroupBlockedParticipantNames] =
    useState<string[]>([]);
  const [groupHasBlockedParticipant, setGroupHasBlockedParticipant] =
    useState(false);
  const [groupBlockWarningDismissed, setGroupBlockWarningDismissed] =
    useState(false);
  const [blockRefreshKey, setBlockRefreshKey] = useState(0);

  useEffect(() => {
    setGroupBlockWarningDismissed(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const conversation = await chatApi.getConversation(id);
        if (conversation) {
          const isGroupChat = conversation.type === "GROUP";
          const fetchedParticipantIds = conversation.participants
            .map((p: any) => p.userId)
            .filter(Boolean);

          const otherParticipant = !isGroupChat
            ? conversation.participants.find(
                (p: any) => p.userId !== authState.user?.userId,
              ) ||
              conversation.participants.find(
                (p: any) => p.userId !== conversation.participants[0]?.userId,
              )
            : null;

          const displayName = isGroupChat
            ? conversation.groupInfo?.groupName || "Group"
            : otherParticipant?.fullName || "Unknown";

          const displayAvatar = !isGroupChat
            ? otherParticipant?.avatarUrl
            : conversation.groupInfo?.groupAvatar;

          setConvDetails({
            isGroup: isGroupChat,
            participantIds: fetchedParticipantIds,
            otherUserId: otherParticipant?.userId || undefined,
            name: displayName,
            avatarUri: displayAvatar || undefined,
            participants: conversation.participants,
          });

          if (isGroupChat) {
            const [blockedFriendsResult, groupMembersResult] =
              await Promise.allSettled([
                authState.user?.userId
                  ? friendApi.getBlockedFriends(authState.user.userId)
                  : Promise.resolve([]),
                chatApi.getGroupMembers(id),
              ]);
            const blockedFriends =
              blockedFriendsResult.status === "fulfilled"
                ? blockedFriendsResult.value
                : [];
            const groupParticipants =
              groupMembersResult.status === "fulfilled"
                ? groupMembersResult.value.items
                : conversation.participants;
            const blockedGroupFriends = getGroupParticipantBlockedFriends(
              groupParticipants,
              blockedFriends,
              authState.user?.userId,
            );
            const blockedIds = getGroupBlockedParticipantIds(
              conversation,
              authState.user?.userId,
            );
            const allBlockedIds = Array.from(
              new Set([
                ...blockedIds,
                ...blockedGroupFriends.map(getBlockedFriendId),
              ]),
            );
            const hasBlockedParticipant = Boolean(
              conversation.myIsBlocked ||
                allBlockedIds.length > 0 ||
                conversation.blockStatus?.isBlocked,
            );

            setGroupHasBlockedParticipant(hasBlockedParticipant);
            const blockedFriendNames = blockedGroupFriends
              .map(getBlockedFriendName)
              .filter(Boolean);
            const participantNames = getParticipantNamesByIds(
              groupParticipants,
              allBlockedIds,
            );

            setGroupBlockedParticipantNames(
              Array.from(new Set([...blockedFriendNames, ...participantNames])),
            );
            setPrivateBlockStatus(EMPTY_PRIVATE_BLOCK_STATUS);
          } else {
            let nextBlockStatus = buildPrivateBlockStatus(conversation);

            try {
              const blockStatus = await chatApi.getBlockStatus(id);
              nextBlockStatus = buildPrivateBlockStatus(
                conversation,
                blockStatus,
              );
            } catch (blockStatusError) {
              console.warn(
                "[ChatScreen] Cannot fetch block status",
                blockStatusError,
              );
            }

            setPrivateBlockStatus(nextBlockStatus);
            setGroupHasBlockedParticipant(false);
            setGroupBlockedParticipantNames([]);
          }
        }
      } catch (error) {
        if (isConversationUnavailableError(error)) {
          console.log(
            "[ChatScreen] Conversation is no longer available; leaving chat screen.",
          );
          router.replace("/(tabs)");
          return;
        }

        console.error(
          "[ChatScreen] Error fetching conversation details:",
          error,
        );
      }
    };

    void fetchDetails();
  }, [
    id,
    convDetails.name,
    convDetails.participantIds.length,
    convDetails.isGroup,
    convDetails.otherUserId,
    convDetails.participants?.length,
    authState.user?.userId,
    blockRefreshKey,
  ]);

  const { colors, colorScheme } = useTheme();
  const callContext = useContext(CallContext);
  const groupCallContext = useContext(GroupCallContext);
  const { markConversationNotificationsAsRead, setActiveConversationId } =
    useNotificationContext();
  const {
    messages,
    inputText,
    setInputText,
    sendMessage,
    sendAttachment,
    replyToMessage,
    setReplyToMessage,
    clearReplyToMessage,
    loadMoreMessages,
    isLoadingMore,
    hasMore,
  } = useChat(id || "");
  const listRef = useRef<FlatList>(null);

  const [forwardVisible, setForwardVisible] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);

  // Message action menu state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [initialViewerImageId, setInitialViewerImageId] = useState<
    string | null
  >(null);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessageItem[]>([]);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [pinOverrides, setPinOverrides] = useState<
    Record<string, { isPinned: boolean; pinnedAt?: string | null }>
  >({});

  const applyPinState = useCallback(
    (messageId: string, isPinned: boolean, pinnedAt?: string | null) => {
      setPinOverrides((prev) => ({
        ...prev,
        [messageId]: { isPinned, pinnedAt },
      }));
    },
    [],
  );

  const loadPinnedMessages = useCallback(async () => {
    if (!id) return;

    try {
      const response = await chatApi.getPinnedMessages(id);
      const sorted = (response.items || [])
        .slice(0, 3)
        .sort((left, right) => {
          const leftTime = new Date(
            String(left.pinnedAt || left.createdAt || 0),
          ).getTime();
          const rightTime = new Date(
            String(right.pinnedAt || right.createdAt || 0),
          ).getTime();
          return rightTime - leftTime;
        });
      setPinnedMessages(sorted);
      setPinOverrides((prev) => {
        const next = { ...prev };
        sorted.forEach((item) => {
          next[item.messageId] = {
            isPinned: true,
            pinnedAt: item.pinnedAt || null,
          };
        });
        return next;
      });
    } catch (error) {
      if (isConversationUnavailableError(error)) {
        console.log(
          "[ChatScreen] Pinned messages skipped because conversation is no longer available.",
        );
        setPinnedMessages([]);
        return;
      }

      console.warn("[ChatScreen] Failed to load pinned messages:", error);
      setPinnedMessages([]);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      console.error("[ChatScreen] Missing required parameter: id");
      Alert.alert("Error", "Invalid chat ID. Going back...");
      setTimeout(() => router.back(), 500);
    }
  }, [id, router]);

  useEffect(() => {
    void loadPinnedMessages();
  }, [loadPinnedMessages]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      setActiveConversationId(id);
      void markConversationNotificationsAsRead(id);
      void loadPinnedMessages();
      setBlockRefreshKey((value) => value + 1);

      return () => {
        setActiveConversationId(undefined);
      };
    }, [
      id,
      loadPinnedMessages,
      markConversationNotificationsAsRead,
      setActiveConversationId,
      setBlockRefreshKey,
    ]),
  );

  const privateMessagingBlocked = !isGroup && privateBlockStatus.isBlocked;
  const privateBlockMessage = privateBlockStatus.iAmTheBlocker
    ? `You have blocked ${name || "this user"}. Unblock to send messages.`
    : `${name || "This user"} has blocked you. You cannot send messages in this chat.`;
  const showGroupBlockWarning =
    isGroup && groupHasBlockedParticipant && !groupBlockWarningDismissed;

  const handleBlockedSendAttempt = useCallback(() => {
    Alert.alert("Cannot send message", privateBlockMessage);
  }, [privateBlockMessage]);

  const handleSend = useCallback((options?: { mentions?: string[]; mentionAll?: boolean }) => {
    if (privateMessagingBlocked) {
      handleBlockedSendAttempt();
      return;
    }

    void sendMessage(inputText, options);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [
    handleBlockedSendAttempt,
    inputText,
    privateMessagingBlocked,
    sendMessage,
  ]);

  const handleMessageLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActionMenu(true);
  }, []);

  const handleMessageDeleted = useCallback(() => {
    // Remove message from list
    // The useChat hook should handle this via socket event
  }, []);

  const handleMessageRecalled = useCallback(() => {
    // The useChat hook should handle this via socket event
  }, []);

  const handleForward = useCallback((messageId: string) => {
    setForwardMessageId(messageId);
    setForwardVisible(true);
  }, []);

  const handleAttach = useCallback(
    (assets: AttachmentAsset[]) => {
      if (privateMessagingBlocked) {
        handleBlockedSendAttempt();
        return;
      }

      assets.forEach((asset) => {
        void sendAttachment(asset);
      });
    },
    [handleBlockedSendAttempt, privateMessagingBlocked, sendAttachment],
  );

  const handleLeaveGroupFromWarning = useCallback(() => {
    if (!id) return;

    Alert.alert("Leave Group", `Do you want to leave the group ${name || "this group"}?`, [
      { text: "Stay", style: "cancel" },
      {
        text: "Leave Group",
        style: "destructive",
        onPress: async () => {
          try {
            await chatApi.leaveGroup(id);
            router.back();
          } catch (error) {
            Alert.alert(
              "Unable to leave group",
              error instanceof Error ? error.message : "Please try again later",
            );
          }
        },
      },
    ]);
  }, [id, name, router]);

  const handleUnblockFromChat = useCallback(async () => {
    if (!id) return;

    try {
      await chatApi.unblockUser(id);
      setPrivateBlockStatus(EMPTY_PRIVATE_BLOCK_STATUS);
      setBlockRefreshKey((value) => value + 1);
    } catch (error) {
      Alert.alert(
        "Unable to unblock",
        error instanceof Error ? error.message : "Please try again later",
      );
    }
  }, [id]);

  const handleStartCall = useCallback(
    async (callType: "audio" | "video") => {
      if (!id) return;

      try {
        if (isGroup) {
          const participantNames: Record<string, string> = {};
          const participantAvatars: Record<string, string> = {};
          if (convDetails.participants) {
            convDetails.participants.forEach((p: any) => {
              if (p.userId) {
                participantNames[p.userId] = p.fullName || `User ${p.userId}`;
                participantAvatars[p.userId] = p.avatarUrl || "";
              }
            });
          }

          await groupCallContext?.initiateGroupCall(
            id,
            participantIds,
            callType,
            participantNames,
            participantAvatars,
          );
          return;
        }

        if (!otherUserId) {
          Alert.alert("Cannot call", "Recipient information is missing");
          return;
        }

        await callContext?.initiateCall(id, otherUserId, callType, {
          name: name || "Friend",
          avatar: avatarUri,
        });
      } catch (error) {
        Alert.alert(
          "Cannot start call",
          error instanceof Error ? error.message : "Please try again later",
        );
      }
    },
    [
      avatarUri,
      callContext,
      groupCallContext,
      id,
      isGroup,
      name,
      otherUserId,
      participantIds,
    ],
  );

  function shouldShowTimestamp(
    messages: ChatMessageListItem[],
    index: number,
  ): boolean {
    if (index === 0) return true;

    const prev = getItemLastMessage(messages[index - 1]);
    const curr = getItemFirstMessage(messages[index]);

    const diffMinutes = getDiffMinutes(prev.timestamp, curr.timestamp);
    return diffMinutes > 30;
  }

  // const lastMessage = messages[messages.length - 1];
  // const lastMessageTimeAgo = lastMessage
  //   ? getDiffMinutes(lastMessage.timestamp, new Date().toISOString())
  //   : "";

  // console.log("LAST MSG ", messages[messages.length - 1]);

  // console.log("LAST MSG TIME AGO ", lastMessageTimeAgo);

  const displayMessages = useMemo(
    () =>
      messages.map((message) => {
        const pinOverride = pinOverrides[message.id];
        if (!pinOverride) return message;

        return {
          ...message,
          isPinned: pinOverride.isPinned,
          pinnedAt: pinOverride.pinnedAt,
        };
      }),
    [messages, pinOverrides],
  );

  const messageItems = useMemo(
    () => buildMessageListItems(displayMessages),
    [displayMessages],
  );

  const imageMessages = useMemo(
    () =>
      displayMessages.filter(
        (message) =>
          String(message.type || "").toUpperCase() === "IMAGE" &&
          Boolean(message.imageUri) &&
          !message.isRecalled,
      ),
    [displayMessages],
  );

  const handleOpenImageViewer = useCallback((message: Message) => {
    setInitialViewerImageId(message.id);
    setImageViewerVisible(true);
  }, []);

  const scrollToMessageId = useCallback(
    (messageId: string) => {
      const targetIndex = messageItems.findIndex((item) => {
        if (item.kind === "imageGroup") {
          return item.messages.some((message) => message.id === messageId);
        }

        return item.message.id === messageId;
      });

      if (targetIndex === -1) {
        Alert.alert("Message not found", "This message has not been loaded yet.");
        return;
      }

      listRef.current?.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0.5,
      });

      setHighlightedMessageId(messageId);

      setTimeout(() => {
        setHighlightedMessageId((current) =>
          current === messageId ? null : current,
        );
      }, 2000);
    },
    [messageItems],
  );

  const handlePinnedMessagePress = useCallback(
    (messageId: string) => {
      setPinnedExpanded(false);
      scrollToMessageId(messageId);
    },
    [scrollToMessageId],
  );

  const handleReplyPreviewPress = useCallback(
    (messageId: string) => {
      scrollToMessageId(messageId);
    },
    [scrollToMessageId],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessageListItem; index: number }) => {
      const firstMessage = getItemFirstMessage(item);
      const displayMessage = getItemLastMessage(item);
      const imageGroup = item.kind === "imageGroup" ? item.messages : undefined;

      return (
        <View>
          {shouldShowTimestamp(messageItems, index) && (
            <MessageTimestamp time={formatTime(firstMessage.timestamp)} />
          )}
          <MessageBubble
            message={displayMessage}
            imageGroup={imageGroup}
            isHighlighted={
              item.kind === "imageGroup"
                ? item.messages.some(
                    (message) => message.id === highlightedMessageId,
                  )
                : displayMessage.id === highlightedMessageId
            }
            showAvatar={shouldShowAvatar(messageItems, index)}
            avatarUri={
              !firstMessage.isMine
                ? firstMessage.senderAvatar || avatarUri
                : undefined
            }
            senderName={
              shouldShowSenderName(messageItems, index)
                ? firstMessage.senderName || name
                : undefined
            }
            onLongPress={handleMessageLongPress}
            participants={convDetails.participants}
            currentUserId={authState.user?.userId}
            onCallBack={(callType) => void handleStartCall(callType)}
            onReply={setReplyToMessage}
            onReplyPreviewPress={handleReplyPreviewPress}
            onImagePress={handleOpenImageViewer}
          />
        </View>
      );
    },
    [
      messageItems,
      highlightedMessageId,
      avatarUri,
      name,
      handleMessageLongPress,
      handleStartCall,
      handleReplyPreviewPress,
      handleOpenImageViewer,
      setReplyToMessage,
      convDetails.participants,
      authState.user?.userId,
    ],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <ChatHeader
        name={name ?? "Chat"}
        avatarUri={avatarUri}
        isOnline
        onAudioCall={() => void handleStartCall("audio")}
        onVideoCall={() => void handleStartCall("video")}
        onMenuPress={() => setInfoVisible(true)}
      />

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {pinnedMessages.length > 0 ? (
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.primary,
              backgroundColor: colors.primaryLight,
            }}
          >
            <View
              style={{
                minHeight: 42,
                paddingHorizontal: 12,
                paddingVertical: 7,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.background,
                }}
              >
                <MaterialCommunityIcons
                  name="pin"
                  size={15}
                  color={colors.primary}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={() =>
                  handlePinnedMessagePress(pinnedMessages[0].messageId)
                }
                style={{ flex: 1 }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    color: colors.primaryDark || colors.primary,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Pinned{pinnedMessages.length > 1 ? ` (${pinnedMessages.length})` : ""}:{" "}
                  {pinnedMessages[0].content ||
                    pinnedMessages[0].attachment?.fileName ||
                    "Pinned content"}
                </Text>
              </TouchableOpacity>
              {pinnedMessages.length > 1 ? (
                <TouchableOpacity
                  hitSlop={8}
                  onPress={() => setPinnedExpanded((value) => !value)}
                >
                  <MaterialCommunityIcons
                    name={pinnedExpanded ? "chevron-up" : "chevron-down"}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
            {pinnedExpanded ? (
              <View style={{ paddingHorizontal: 12, paddingBottom: 8, gap: 6 }}>
                {pinnedMessages.map((pinned, index) => (
                  <TouchableOpacity
                    key={pinned.messageId}
                    activeOpacity={0.78}
                    onPress={() => handlePinnedMessagePress(pinned.messageId)}
                    style={{
                      minHeight: 34,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      backgroundColor: colors.background,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 10,
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        width: 16,
                        color: colors.primary,
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {index + 1}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        color: colors.text,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {pinned.content ||
                        pinned.attachment?.fileName ||
                        "Pinned content"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messageItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingVertical: 12,
          }}
          onScroll={(e) => {
            if (e.nativeEvent.contentOffset.y <= 0 && hasMore && !isLoadingMore) {
              void loadMoreMessages();
            }
          }}
          onContentSizeChange={(_, contentHeight) => {
            // Only auto-scroll to bottom if we are not loading more messages
            if (!isLoadingMore && hasMore !== undefined) {
               // Fallback: mostly scroll to end if not in middle of fetching history
               listRef.current?.scrollToEnd({ animated: false });
            }
          }}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });

            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5,
              });
            }, 250);
          }}
          showsVerticalScrollIndicator={false}
        />

        {privateMessagingBlocked ? (
          <View
            style={{
              marginHorizontal: 12,
              marginBottom: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor:
                colorScheme === "dark"
                  ? "rgba(239, 68, 68, 0.14)"
                  : "rgba(239, 68, 68, 0.08)",
              borderWidth: 1,
              borderColor: "rgba(239, 68, 68, 0.24)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colorScheme === "dark" ? "#FCA5A5" : "#B91C1C",
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {privateBlockMessage}
            </Text>
            {privateBlockStatus.iAmTheBlocker ? (
              <TouchableOpacity
                style={{
                  width: "100%",
                }}
                onPress={handleUnblockFromChat}
              >
                <Text
                  style={{
                    backgroundColor:
                      colorScheme === "dark" ? "#B91C1C" : "#fdc1c1",
                    color: "#B91C1C",
                    textAlign: "center",
                    borderRadius: 8,
                    paddingVertical: 8,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Unblock
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {showGroupBlockWarning ? (
          <View
            style={{
              marginHorizontal: 12,
              marginBottom: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor:
                colorScheme === "dark"
                  ? "rgba(245, 158, 11, 0.16)"
                  : "rgba(245, 158, 11, 0.12)",
              borderWidth: 1,
              borderColor: "rgba(245, 158, 11, 0.28)",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text
              style={{
                flex: 1,
                color: colorScheme === "dark" ? "#FCD34D" : "#92400E",
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {groupBlockedParticipantNames.length > 0
                ? `There are blocked members (${groupBlockedParticipantNames.join(", ")}) in this group. Do you want to leave the group?`
                : "There are blocked members in this group. Do you want to leave the group?"}
            </Text>
            <TouchableOpacity onPress={handleLeaveGroupFromWarning}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                Leave Group
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGroupBlockWarningDismissed(true)}
              hitSlop={10}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                x
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Input */}
        <MessageInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onAttach={handleAttach}
          replyToMessage={replyToMessage}
          onCancelReply={clearReplyToMessage}
          disabled={privateMessagingBlocked}
          disabledPlaceholder={
            privateMessagingBlocked
              ? privateBlockMessage
              : "Type your message"
          }
          participants={convDetails.participants}
          currentUserId={authState.user?.userId}
        />
      </KeyboardAvoidingView>

      {/* Message Action Menu */}
      {selectedMessage && (
        <MessageActionMenu
          visible={showActionMenu}
          onClose={() => {
            setShowActionMenu(false);
            setSelectedMessage(null);
          }}
          onForward={handleForward}
          message={selectedMessage}
          conversationId={id || ""}
          onMessageDeleted={handleMessageDeleted}
          onMessageRecalled={handleMessageRecalled}
          onMessagePinned={() => {
            if (selectedMessage) {
              applyPinState(
                selectedMessage.id,
                !selectedMessage.isPinned,
                !selectedMessage.isPinned ? new Date().toISOString() : null,
              );
            }
            void loadPinnedMessages();
          }}
          onReply={(message) => {
            setReplyToMessage(message);
            setShowActionMenu(false);
            setSelectedMessage(null);
          }}
        />
      )}
      <ImageViewerModal
        visible={imageViewerVisible}
        images={imageMessages}
        initialMessageId={initialViewerImageId}
        conversationId={id || ""}
        onClose={() => setImageViewerVisible(false)}
      />
      <ConversationInfoModal
        visible={infoVisible}
        conversationId={id || ""}
        name={name || "Chat"}
        avatarUri={avatarUri}
        isGroup={isGroup}
        onClose={() => {
          setInfoVisible(false);
          setBlockRefreshKey((value) => value + 1);
        }}
        onConversationDeleted={() => router.back()}
      />
      {forwardMessageId && (
        <ForwardConversationModal
          visible={forwardVisible}
          onClose={() => {
            setForwardVisible(false);
            setForwardMessageId(null);
          }}
          sourceMessageId={forwardMessageId}
          currentConversationId={id || ""}
          onForward={async (targetConversationId: string) => {
            try {
              const clientMessageId = generateUniqueId();
              await chatApi.forwardMessage(
                forwardMessageId,
                targetConversationId,
                clientMessageId,
              );
            } catch (error) {
              console.error("Forward error:", error);
              const message =
                error instanceof Error ? error.message.toLowerCase() : "";
              if (
                message.includes("block") ||
                message.includes("blocked") ||
                message.includes("cannot send")
              ) {
                Alert.alert(
                  "Cannot send message",
                  "You cannot forward because of a blocked relationship.",
                );
                return;
              }
              Alert.alert(
                "Unable to forward",
                error instanceof Error
                  ? error.message
                  : "Please try again later",
              );
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
