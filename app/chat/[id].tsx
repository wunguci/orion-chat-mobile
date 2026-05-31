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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ForwardConversationModal from "@/components/chat/ForwardConversationModal";
import { generateUniqueId } from "@/utils/generateUniqueId";
import { chatApi } from "@/services/api/chat";
import { useNotificationContext } from "@/context/NotificationContext";
import { useFocusEffect } from "expo-router";
import { CallContext } from "@/context/CallContext";
import { GroupCallContext } from "@/context/GroupCallContext";
import { useAuth } from "@/hooks/useAuth";

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
  return (
    String(message.type || "").toUpperCase() === "IMAGE" &&
    Boolean(message.imageUri) &&
    !message.imageCaption &&
    !message.isRecalled &&
    !message.reactions?.length
  );
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

  useEffect(() => {
    if (!id) return;

    // Check if we need to fetch additional details
    const needsFetch =
      !convDetails.name ||
      convDetails.name === "Chat" ||
      convDetails.participantIds.length === 0 ||
      (!convDetails.isGroup && !convDetails.otherUserId) ||
      (convDetails.isGroup &&
        (!convDetails.participants || convDetails.participants.length === 0));

    if (!needsFetch) return;

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
        }
      } catch (error) {
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
  ]);

  const { colors, colorScheme } = useTheme();
  const callContext = useContext(CallContext);
  const groupCallContext = useContext(GroupCallContext);
  const { markConversationNotificationsAsRead } = useNotificationContext();
  const {
    messages,
    inputText,
    setInputText,
    sendMessage,
    sendAttachment,
    replyToMessage,
    setReplyToMessage,
    clearReplyToMessage,
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

  useEffect(() => {
    if (!id) {
      console.error("[ChatScreen] Missing required parameter: id");
      Alert.alert("Error", "Invalid chat ID. Going back...");
      setTimeout(() => router.back(), 500);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      void markConversationNotificationsAsRead(id);
    }, [id, markConversationNotificationsAsRead]),
  );

  const handleSend = useCallback(() => {
    void sendMessage(inputText);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [inputText, sendMessage]);

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
      assets.forEach((asset) => {
        void sendAttachment(asset);
      });
    },
    [sendAttachment],
  );

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
          Alert.alert("Khong the goi", "Thieu thong tin nguoi nhan");
          return;
        }

        await callContext?.initiateCall(id, otherUserId, callType, {
          name: name || "Friend",
          avatar: avatarUri,
        });
      } catch (error) {
        Alert.alert(
          "Khong the bat dau cuoc goi",
          error instanceof Error ? error.message : "Vui long thu lai sau",
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

  const messageItems = useMemo(
    () => buildMessageListItems(messages),
    [messages],
  );

  const imageMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          String(message.type || "").toUpperCase() === "IMAGE" &&
          Boolean(message.imageUri) &&
          !message.isRecalled,
      ),
    [messages],
  );

  const handleOpenImageViewer = useCallback((message: Message) => {
    setInitialViewerImageId(message.id);
    setImageViewerVisible(true);
  }, []);

  const handleReplyPreviewPress = useCallback(
    (messageId: string) => {
      const targetIndex = messageItems.findIndex((item) => {
        if (item.kind === "imageGroup") {
          return item.messages.some((message) => message.id === messageId);
        }

        return item.message.id === messageId;
      });

      if (targetIndex === -1) {
        Alert.alert("Khong tim thay tin nhan", "Tin nhan nay chua duoc tai.");
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
            onCallBack={(callType) => void handleStartCall(callType)}
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
        <FlatList
          ref={listRef}
          data={messageItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingVertical: 12,
          }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
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

        {/* Input */}
        <MessageInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onAttach={handleAttach}
          replyToMessage={replyToMessage}
          onCancelReply={clearReplyToMessage}
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
        onClose={() => setInfoVisible(false)}
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
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
