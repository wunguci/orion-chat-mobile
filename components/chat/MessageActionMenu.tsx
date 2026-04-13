import React, { useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Text,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Message } from "@/types/chat";
import { chatApi } from "@/services/api/chat";

// Emoji list cho reaction
const EMOJI_LIST = ["😂", "❤️", "😍", "😮", "😢", "🔥", "👍", "👎"];

interface MessageActionMenuProps {
  visible: boolean;
  onClose: () => void;
  message: Message;
  conversationId: string;
  onMessageDeleted?: () => void;
  onMessageRecalled?: () => void;
  onMessageForwarded?: () => void;
}

export default function MessageActionMenu({
  visible,
  onClose,
  message,
  conversationId,
  onMessageDeleted,
  onMessageRecalled,
  onMessageForwarded,
}: MessageActionMenuProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleAddEmoji = async (emoji: string) => {
    setIsLoading(true);
    try {
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
              await chatApi.revokeMessage(message.id, conversationId);
              onMessageRecalled?.();
              onClose();
            } catch (error) {
              console.error("Failed to recall message:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to recall message",
              );
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

  const handleForward = async () => {
    // TODO: Hiển thị dialog chọn conversation để forward
    Alert.alert("Forward", "Chọn cuộc trò chuyện để chuyển tiếp (sắp có)");
  };

  return (
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
              {/* Emoji Picker Button */}
              <TouchableOpacity
                onPress={() => setShowEmojiPicker(true)}
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
                  name="emoticon-happy-outline"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ fontSize: 16, color: colors.text }}>
                  Gửi emoji
                </Text>
              </TouchableOpacity>

              {/* Copy Button - Sắp có */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.backgroundSecondary,
                }}
                disabled
              >
                <MaterialCommunityIcons
                  name="content-copy"
                  size={24}
                  color="rgba(128,128,128,0.5)"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: "rgba(128,128,128,0.5)",
                  }}
                >
                  Sao chép (sắp có)
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
                <Text style={{ fontSize: 16, color: colors.text }}>
                  Chuyển tiếp
                </Text>
              </TouchableOpacity>

              {/* Recall Button - chỉ nếu là tin nhắn của mình */}
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
                  <Text style={{ fontSize: 16, color: colors.text }}>
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
                <Text style={{ fontSize: 16, color: "#E53C51" }}>Xóa</Text>
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
                      fontSize: 32,
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
  );
}
