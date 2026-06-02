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
  Image,
  ScrollView,
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
  participants?: { userId: string; fullName: string; avatarUrl?: string }[];
  currentUserId?: string;
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
  participants = [],
  currentUserId,
}: MessageInputProps) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const [pendingAssets, setPendingAssets] = useState<AttachmentAsset[]>([]);
  const hasText = !disabled && value.trim().length > 0;
  const hasPendingAssets = !disabled && pendingAssets.length > 0;
  const showSend = hasText || hasPendingAssets;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [previousValue, setPreviousValue] = useState<string | null>(null);

  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const handleTextChange = (text: string) => {
    onChangeText(text);
    const match = text.match(/@([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF ]*)$/);
    if (match) {
      setShowMentionPicker(true);
      setMentionQuery(match[1].toLowerCase());
    } else {
      setShowMentionPicker(false);
      setMentionQuery("");
    }
  };

  const handleSelectMention = (name: string) => {
    const newText = value.replace(/@([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF ]*)$/, `@${name} `);
    onChangeText(newText);
    setShowMentionPicker(false);
    setMentionQuery("");
  };

  const parseMentionsFromText = (text: string, currentParticipants: any[]) => {
    if (!currentParticipants || currentParticipants.length === 0) return { mentions: [], mentionAll: false };
    const mentions: string[] = [];
    let mentionAll = false;
    
    const sortedParticipants = [...currentParticipants]
      .filter((p) => p.fullName && p.userId !== currentUserId)
      .sort((a, b) => b.fullName.length - a.fullName.length);

    let tempText = text;

    if (tempText.includes("@all") || tempText.includes("@tất cả")) {
      mentionAll = true;
      tempText = tempText.replace(/@all/gi, "").replace(/@tất cả/gi, "");
    }

    for (const p of sortedParticipants) {
      const mentionStr = `@${p.fullName}`;
      if (tempText.includes(mentionStr)) {
        mentions.push(p.userId);
        tempText = tempText.replace(new RegExp(mentionStr, 'g'), "");
      }
    }
    
    return { mentions, mentionAll };
  };

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
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Mention Picker */}
        {showMentionPicker && participants && participants.length > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: "100%",
              left: 12,
              right: 12,
              maxHeight: 220,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
              marginBottom: 8,
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              zIndex: 20,
            }}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              {("all".includes(mentionQuery) || "tất cả".includes(mentionQuery)) && (
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => handleSelectMention("all")}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>@</Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>@all (Tất cả)</Text>
                </TouchableOpacity>
              )}
              {participants
                .filter((p) => p.userId !== currentUserId)
                .filter((p) => p.fullName?.toLowerCase().includes(mentionQuery))
                .map((p) => (
                  <TouchableOpacity
                    key={p.userId}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    onPress={() => handleSelectMention(p.fullName)}
                  >
                    {p.avatarUrl ? (
                      <Image source={{ uri: p.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12 }} />
                    ) : (
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.backgroundSecondary, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>
                          {p.fullName?.[0]?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <Text style={{ color: colors.text, fontSize: 15 }}>{p.fullName}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}
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
              backgroundColor: colors.primaryLight,
              borderLeftWidth: 3,
              borderLeftColor: colors.primary,
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
                  <Reply size={16} color={colors.primary} strokeWidth={2.4} />
                </View>

                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: colors.primaryDark,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Replying to{" "}
                  {replyToMessage.isMine
                    ? "You"
                    : replyToMessage.senderName || "Unknown"}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={{
                  color: colors.text,
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
              <Ionicons name="close" size={26} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Pending Assets Preview */}
        {pendingAssets.length > 0 ? (
          <View
            style={{
              paddingTop: 10,
              paddingBottom: 10,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.divider,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 12,
                paddingHorizontal: 12,
              }}
            >
              {pendingAssets.map((asset, index) => {
                const isImage = asset.mimeType.startsWith("image/");
                return (
                  <View
                    key={`${asset.uri}-${index}`}
                    style={{
                      position: "relative",
                      width: 68,
                      height: 68,
                      justifyContent: "flex-end",
                      alignItems: "flex-start",
                    }}
                  >
                    {isImage ? (
                      <Image
                        source={{ uri: asset.uri }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          backgroundColor: colors.backgroundSecondary,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Ionicons
                          name="document-attach-outline"
                          size={24}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        setPendingAssets((prev) =>
                          prev.filter((_, idx) => idx !== index)
                        );
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: "#FF3B30",
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                        elevation: 3,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 1,
                      }}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
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
              onChangeText={handleTextChange}
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
          {showSend ? (
            <>
              {hasText ? (
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
              ) : null}
              <TouchableOpacity
                onPress={() => {
                  if (disabled) return;
                  setPreviousValue(null);

                  if (hasPendingAssets) {
                    onAttach?.(pendingAssets);
                    setPendingAssets([]);
                  }
                  if (hasText) {
                    const { mentions, mentionAll } = parseMentionsFromText(value, participants);
                    // @ts-ignore - type onSend option isn't in interface but handled
                    onSend({ mentions, mentionAll });
                  }
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
          setPendingAssets((prev) => [...prev, ...assets]);
        }}
      />
    </>
  );
}
