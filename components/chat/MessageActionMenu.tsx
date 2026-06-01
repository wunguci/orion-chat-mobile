import React, { useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Text,
  Alert,
  ActivityIndicator,
  Clipboard,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Message } from "@/types/chat";
import { chatApi } from "@/services/api/chat";
import { formatGridResponse, orionAiApi } from "@/services/api/orionAi";

// Emoji list cho reaction
const EMOJI_LIST = ["😂", "❤️", "😍", "😮", "😢", "🔥", "👍", "👎"];
const QUICK_EMOJI_LIST = EMOJI_LIST.slice(0, 6);

interface MessageActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onForward: (messageId: string) => void;
  message: Message;
  conversationId: string;
  onMessageDeleted?: () => void;
  onMessageRecalled?: () => void;
  onMessageForwarded?: () => void;
  onMessagePinned?: () => void;
  onReply?: (message: Message) => void;
}

export default function MessageActionMenu({
  visible,
  onClose,
  onForward,
  message,
  conversationId,
  onMessageDeleted,
  onMessageRecalled,
  onMessageForwarded,
  onMessagePinned,
  onReply,
}: MessageActionMenuProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleAddEmoji = async (emoji: string) => {
    setIsLoading(true);
    try {
      console.log("[handleAddEmoji]", {
        messageId: message.id,
        emoji,
        conversationId,
        messageObject: message,
      });
      await chatApi.addEmojiReaction(message.id, emoji, conversationId);
      setShowEmojiPicker(false);
      onClose();
    } catch (error) {
      console.error("Failed to add emoji:", error);
      Alert.alert("Error", "Failed to add emoji reaction");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecall = async () => {
    Alert.alert(
      "Nhắc lại tin nhắn?",
      "Tin nhắn sẽ bị thu hồi khỏi tất cả các thiết bị",
      [
        { text: "Hủy", onPress: () => {} },
        {
          text: "Thu hồi",
          onPress: async () => {
            setIsLoading(true);
            try {
              console.log("[MessageActionMenu] Recalling message:", {
                messageId: message.id,
                conversationId,
                isMine: message.isMine,
                senderName: message.senderName,
              });

              const result = await chatApi.revokeMessage(
                message.id,
                conversationId,
              );

              console.log("[MessageActionMenu] Recall success:", result);
              onMessageRecalled?.();
              onClose();
            } catch (error) {
              console.error("Failed to recall message:", error);
              const errorMsg =
                error instanceof Error
                  ? error.message
                  : "Failed to recall message";
              console.error("[MessageActionMenu] Recall error details:", {
                errorMsg,
                errorFull: error,
                messageId: message.id,
              });
              Alert.alert("Error", errorMsg);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      "Xóa tin nhắn?",
      "Tin nhắn này sẽ chỉ bị ẩn ở thiết bị của bạn",
      [
        { text: "Hủy", onPress: () => {} },
        {
          text: "Xóa",
          onPress: async () => {
            setIsLoading(true);
            try {
              await chatApi.deleteMessageForMe(message.id, conversationId);
              onMessageDeleted?.();
              onClose();
            } catch (error) {
              console.error("Failed to delete message:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete message",
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleCopy = async () => {
    try {
      if (message.text) {
        await Clipboard.setString(message.text);
        Alert.alert("Thành công", "Đã sao chép tin nhắn");
        onClose();
      }
    } catch (error) {
      console.error("Failed to copy message:", error);
      Alert.alert("Lỗi", "Không thể sao chép tin nhắn");
    }
  };

  const handleForward = () => {
    onForward(message.id);
    onClose();
  };

  const handleTogglePin = async () => {
    setIsLoading(true);
    try {
      if (message.isPinned) {
        await chatApi.unpinMessage(conversationId, message.id);
      } else {
        await chatApi.pinMessage(conversationId, message.id);
      }
      onMessagePinned?.();
      onClose();
    } catch (error) {
      Alert.alert(
        "Không thể thực hiện",
        error instanceof Error ? error.message : "Vui lòng thử lại sau",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = () => {
    onReply?.(message);
    onClose();
  };

  const handleAISummarize = async () => {
    setIsLoading(true);
    try {
      const response = await orionAiApi.summarizeConversation({
        conversationId,
        mode: "range",
        rangeMonths: 1,
      });
      Alert.alert(response.title || "AI summary", formatGridResponse(response));
      onClose();
    } catch (error) {
      Alert.alert(
        "AI summary failed",
        error instanceof Error ? error.message : "Please try again later",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIReplySuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await orionAiApi.suggestReplies({
        conversationId,
        limit: 4,
      });
      Alert.alert(
        response.title || "AI reply suggestions",
        formatGridResponse(response),
      );
      onClose();
    } catch (error) {
      Alert.alert(
        "AI suggestions failed",
        error instanceof Error ? error.message : "Please try again later",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        {/* Overlay background */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: 20,
            }}
          >
            {isLoading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 16,
                  zIndex: 10,
                }}
              >
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}

            {!showEmojiPicker ? (
              <ScrollView scrollEnabled={false}>
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.text,
                      fontWeight: "600",
                      marginBottom: 10,
                    }}
                  >
                    Thả cảm xúc
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {QUICK_EMOJI_LIST.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => handleAddEmoji(emoji)}
                        disabled={isLoading}
                        activeOpacity={0.75}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.backgroundSecondary,
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setShowEmojiPicker(true)}
                      disabled={isLoading}
                      activeOpacity={0.75}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.primaryLight,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={24}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleReply}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                  }}
                >
                  <MaterialCommunityIcons
                    name="reply"
                    size={24}
                    color={colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={{ fontSize: 16, color: colors.text }}>
                    Trả lời
                  </Text>
                </TouchableOpacity>

                {/* Copy Button */}
                <TouchableOpacity
                  onPress={handleCopy}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                  }}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={24}
                    color={colors.text}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    Sao chép
                  </Text>
                </TouchableOpacity>

                {/* Forward Button */}
                <TouchableOpacity
                  onPress={handleForward}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                  }}
                >
                  <MaterialCommunityIcons
                    name="forward"
                    size={24}
                    color={colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    Chuyển tiếp
                  </Text>
                </TouchableOpacity>

                {/* Recall Button - chỉ nếu là tin nhắn của mình */}
                <TouchableOpacity
                  onPress={handleTogglePin}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                  }}
                >
                  <MaterialCommunityIcons
                    name={message.isPinned ? "pin-off-outline" : "pin-outline"}
                    size={24}
                    color={colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    {message.isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAISummarize}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                  }}
                >
                  <MaterialCommunityIcons
                    name="text-box-search-outline"
                    size={24}
                    color={colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    AI summarize chat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAIReplySuggestions}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                  }}
                >
                  <MaterialCommunityIcons
                    name="message-reply-text-outline"
                    size={24}
                    color={colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    AI reply suggestions
                  </Text>
                </TouchableOpacity>

                {message.isMine && (
                  <TouchableOpacity
                    onPress={handleRecall}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.backgroundSecondary,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="undo"
                      size={24}
                      color={colors.primary}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.text,
                      }}
                    >
                      Thu hồi
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={handleDelete}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={24}
                    color="#E53C51"
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#E53C51",
                    }}
                  >
                    Xóa
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View>
                {/* Back button */}
                <TouchableOpacity
                  onPress={() => setShowEmojiPicker(false)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundSecondary,
                  }}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={24}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                      marginLeft: 12,
                    }}
                  >
                    Quay lại
                  </Text>
                </TouchableOpacity>

                {/* Emoji Grid */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                  }}
                >
                  {EMOJI_LIST.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleAddEmoji(emoji)}
                      style={{
                        padding: 8,
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
