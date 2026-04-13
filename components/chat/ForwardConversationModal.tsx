import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { chatApi, ConversationResponse } from "@/services/api/chat";
import ChatAvatar from "./ChatAvatar";

/**
 * Thành phần Modal chuyển tiếp tin nhắn
 *
 * Luồng hoạt động:
 * 1. Người dùng chọn "Chuyển tiếp" trên tin nhắn
 * 2. Modal hiển thị danh sách tất cả conversation của user
 * 3. Người dùng chọn conversation đích
 * 4. Gọi API forwardMessage với ID tin nhắn gốc + conversation đích
 * 5. Server tạo copy tin nhắn trong conversation mới
 * 6. Quay lại chat list
 */
interface ForwardConversationModalProps {
  visible: boolean;
  onClose: () => void;
  onForward: (conversationId: string) => Promise<void>;
  sourceMessageId: string;
  currentConversationId: string;
}

export default function ForwardConversationModal({
  visible,
  onClose,
  onForward,
  sourceMessageId,
  currentConversationId,
}: ForwardConversationModalProps) {
  const { colors } = useTheme();
  const { state: authState } = useAuth();
  const [conversations, setConversations] = useState<ConversationResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [forwarding, setForwarding] = useState(false);

  /**
   * Load danh sách conversation khi modal mở
   */
  useEffect(() => {
    if (!visible || !authState.user?.userId) return;

    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await chatApi.getConversations(
          authState.user!.userId,
          100,
          0,
        );
        // Lọc ra conversation khác (không bao gồm conversation hiện tại)
        const filtered = data.filter(
          (c) => c.conversationId !== currentConversationId,
        );
        setConversations(filtered);
      } catch (error) {
        console.error("Error loading conversations for forward:", error);
        Alert.alert("Lỗi", "Không thể tải danh sách cuộc trò chuyện");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [visible, authState.user?.userId, currentConversationId]);

  /**
   * Xử lý chuyển tiếp tin nhắn
   */
  const handleForwardMessage = async () => {
    if (!selectedConversationId) {
      Alert.alert("Thông báo", "Vui lòng chọn cuộc trò chuyện");
      return;
    }

    try {
      setForwarding(true);
      await onForward(selectedConversationId);
      Alert.alert("Thành công", "Tin nhắn đã được chuyển tiếp");
      onClose();
      setSelectedConversationId(null);
    } catch (error) {
      console.error("Error forwarding message:", error);
      Alert.alert(
        "Lỗi",
        error instanceof Error
          ? error.message
          : "Không thể chuyển tiếp tin nhắn",
      );
    } finally {
      setForwarding(false);
    }
  };

  /**
   * Render item trong danh sách conversation
   */
  const renderConversationItem = ({ item }: { item: ConversationResponse }) => {
    const isGroup = item.type === "GROUP";
    const otherParticipant = !isGroup
      ? item.participants.find(
          (p: any) => p.userId !== item.participants[0]?.userId,
        )
      : null;
    const displayName = isGroup
      ? item.groupInfo?.groupName || "Nhóm"
      : otherParticipant?.fullName || "Không xác định";

    const isSelected = selectedConversationId === item.conversationId;

    return (
      <TouchableOpacity
        onPress={() => setSelectedConversationId(item.conversationId)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isSelected
            ? colors.primary + "20"
            : colors.background,
          borderLeftWidth: isSelected ? 4 : 0,
          borderLeftColor: isSelected ? colors.primary : "transparent",
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary + "30",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 24 }}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Tên và loại */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {displayName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            {isGroup ? `${item.participants.length} người` : "Chat 1 kèm 1"}
          </Text>
        </View>

        {/* Checkbox đơn giản */}
        {isSelected && (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 16 }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{ flex: 1, backgroundColor: colors.background, paddingTop: 50 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Chuyển tiếp tới
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.primary,
                  fontWeight: "600",
                }}
              >
                Đóng
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            Chọn cuộc trò chuyện để chuyển tiếp tin nhắn
          </Text>
        </View>

        {/* Danh sách conversation */}
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : conversations.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
              }}
            >
              Không có cuộc trò chuyện nào
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.conversationId}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 0.5,
                  marginLeft: 76,
                  backgroundColor: colors.divider,
                }}
              />
            )}
          />
        )}

        {/* Footer với nút "Chuyển tiếp" */}
        {!loading && conversations.length > 0 && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <TouchableOpacity
              onPress={handleForwardMessage}
              disabled={!selectedConversationId || forwarding}
              style={{
                backgroundColor:
                  selectedConversationId && !forwarding
                    ? colors.primary
                    : colors.primary + "50",
                paddingVertical: 14,
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              {forwarding ? (
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
              ) : null}
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {forwarding ? "Đang chuyển tiếp..." : "Chuyển tiếp"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}
