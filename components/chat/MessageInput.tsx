import AttachmentPickerModal from "@/components/chat/AttachmentPickerModal";
import { Camera, Reply } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import {
  extractPrimaryText,
  orionAiApi,
  RewriteTone,
} from "@/services/api/orionAi";
import { AttachmentAsset, Message } from "@/types/chat";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach?: (asset: AttachmentAsset[]) => void;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  disabledPlaceholder?: string;
}

export default function MessageInput({
  value,
  onChangeText,
  onSend,
  onAttach,
  replyToMessage,
  onCancelReply,
  disabled = false,
  disabledPlaceholder,
}: MessageInputProps) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const hasText = !disabled && value.trim().length > 0;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [previousValue, setPreviousValue] = useState<string | null>(null);

  const handleRewrite = async (tone: RewriteTone) => {
    if (!hasText || isRewriting || disabled) return;

    setIsRewriting(true);
    try {
      const response = await orionAiApi.rewriteMessage({
        message: value,
        tone,
        audience: "Orion Chat recipient",
      });
      const rewritten = extractPrimaryText(response);
      if (rewritten) {
        setPreviousValue(value);
        onChangeText(rewritten);
      }
    } catch (error) {
      Alert.alert(
        "AI rewrite failed",
        error instanceof Error ? error.message : "Please try again later.",
      );
    } finally {
      setIsRewriting(false);
    }
  };

  const showRewriteOptions = () => {
    Alert.alert("Rewrite message", "Choose a tone", [
      {
        text: "Professional",
        onPress: () => void handleRewrite("professional"),
      },
      { text: "Polite", onPress: () => void handleRewrite("polite") },
      { text: "Concise", onPress: () => void handleRewrite("concise") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <>
      <View
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 0.5,
          borderTopColor: colors.divider,
          paddingBottom: bottom > 0 ? bottom : Platform.OS === "ios" ? 20 : 10,
        }}
      >
        {previousValue ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              paddingHorizontal: 12,
              paddingTop: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                onChangeText(previousValue);
                setPreviousValue(null);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <Ionicons
                name="arrow-undo-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Undo
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Reply preview */}
        {replyToMessage ? (
          <View
            style={{
              marginHorizontal: 12,
              marginTop: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 6,
              backgroundColor: "#f6f6f6",
              borderLeftWidth: 3,
              borderLeftColor: "#4F9BFF",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    transform: [{ rotate: "180deg" }],
                  }}
                >
                  <Reply size={16} color="#505050" strokeWidth={2.4} />
                </View>

                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: "#505050",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Trả lời{" "}
                  {replyToMessage.isMine
                    ? "Bạn"
                    : replyToMessage.senderName || "Unknown"}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={{
                  color: "#505050",
                  fontSize: 15,
                }}
              >
                {replyToMessage.text ||
                  replyToMessage.imageCaption ||
                  replyToMessage.fileName ||
                  "Attachment"}
              </Text>
            </View>

            <TouchableOpacity onPress={onCancelReply} hitSlop={10}>
              <Ionicons name="close" size={26} color="#AEB7C2" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 12,
            paddingTop: 8,
            gap: 8,
          }}
        >
          {/* Attach */}
          <TouchableOpacity
            onPress={() => {
              if (disabled) return;
              setPickerVisible(true);
            }}
            disabled={disabled}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 2,
              opacity: disabled ? 0.45 : 1,
            }}
          >
            <Ionicons name="add" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Text input */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 22,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === "ios" ? 10 : 5,
              minHeight: 40,
              justifyContent: "center",
            }}
          >
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={disabledPlaceholder || "Type your message"}
              placeholderTextColor={colors.textSecondary}
              style={{
                color: colors.text,
                fontSize: 15,
                maxHeight: 100,
                textAlignVertical: "center",
              }}
              multiline
              returnKeyType="default"
              editable={!isRewriting && !disabled}
            />
          </View>

          {/* Send or mic + emoji */}
          {hasText ? (
            <>
              <TouchableOpacity
                onPress={showRewriteOptions}
                disabled={isRewriting || disabled}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.backgroundSecondary,
                  opacity: disabled ? 0.45 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 2,
                }}
              >
                {isRewriting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="color-wand-outline"
                    size={18}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (disabled) return;
                  setPreviousValue(null);
                  onSend();
                }}
                disabled={isRewriting || disabled}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor:
                    isRewriting || disabled ? colors.border : colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 2,
                }}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginBottom: 2,
              }}
            >
              <TouchableOpacity hitSlop={8}>
                <Ionicons
                  name="mic-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity hitSlop={8}>
                <MaterialCommunityIcons
                  name="sticker-emoji"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <AttachmentPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAttach={(assets) => {
          setPickerVisible(false);
          if (disabled) return;
          onAttach?.(assets);
        }}
      />
    </>
  );
}
