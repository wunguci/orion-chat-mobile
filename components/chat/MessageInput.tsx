import AttachmentPickerModal from "@/components/chat/AttachmentPickerModal";
import { useTheme } from "@/hooks/useTheme";
import {
  extractPrimaryText,
  orionAiApi,
  RewriteTone,
} from "@/services/api/orionAi";
import { AttachmentAsset } from "@/types/chat";
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
  onAttach?: (asset: AttachmentAsset) => void;
}

export default function MessageInput({
  value,
  onChangeText,
  onSend,
  onAttach,
}: MessageInputProps) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const hasText = value.trim().length > 0;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [previousValue, setPreviousValue] = useState<string | null>(null);

  const handleRewrite = async (tone: RewriteTone) => {
    if (!hasText || isRewriting) return;

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
      { text: "Professional", onPress: () => void handleRewrite("professional") },
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
          onPress={() => setPickerVisible(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 2,
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
            placeholder="Type your message"
            placeholderTextColor={colors.textSecondary}
            style={{
              color: colors.text,
              fontSize: 15,
              maxHeight: 100,
              textAlignVertical: "center",
            }}
            multiline
            returnKeyType="default"
            editable={!isRewriting}
          />
        </View>

        {/* Send or mic + emoji */}
        {hasText ? (
          <>
            <TouchableOpacity
              onPress={showRewriteOptions}
              disabled={isRewriting}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.backgroundSecondary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 2,
              }}
            >
              {isRewriting ? (
                <ActivityIndicator size="small" color="#00B14F" />
              ) : (
                <Ionicons
                  name="color-wand-outline"
                  size={18}
                  color="#00B14F"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setPreviousValue(null);
                onSend();
              }}
              disabled={isRewriting}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isRewriting ? colors.border : "#00B14F",
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
        onAttach={(asset) => {
          setPickerVisible(false);
          onAttach?.(asset);
        }}
      />
    </>
  );
}
