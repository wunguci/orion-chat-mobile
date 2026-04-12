import { formatTime } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { Message } from "@/types/chat";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Linking, Text, TouchableOpacity, View } from "react-native";

const AVATAR_SIZE = 32;

// ── Status checkmarks ────────────────────────────────────────
function MessageStatus({ status }: { status?: Message["status"] }) {
  if (!status) return null;
  if (status === "sending") {
    return (
      <MaterialCommunityIcons
        name="clock-outline"
        size={13}
        color="rgba(255,255,255,0.6)"
      />
    );
  }
  if (status === "read") {
    return (
      <MaterialCommunityIcons name="check-all" size={14} color="#00B14F" />
    );
  }
  return (
    <MaterialCommunityIcons
      name="check"
      size={13}
      color="rgba(255,255,255,0.7)"
    />
  );
}

// ── Text bubble ──────────────────────────────────────────────
function TextBubble({
  message,
  bubbleBg,
  textColor,
}: {
  message: Message;
  bubbleBg: string;
  textColor: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: bubbleBg,
        borderRadius: 18,
        borderBottomRightRadius: message.isMine ? 4 : 18,
        borderBottomLeftRadius: message.isMine ? 18 : 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: "78%",
      }}
    >
      <Text style={{ color: textColor, fontSize: 15, lineHeight: 21 }}>
        {message.text}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

// ── Image bubble ─────────────────────────────────────────────
function ImageBubble({ message }: { message: Message }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        maxWidth: "78%",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.card,
      }}
    >
      <Image
        source={{ uri: message.imageUri }}
        style={{ width: 240, height: 180 }}
        resizeMode="cover"
      />
      {message.imageCaption ? (
        <View style={{ padding: 10 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {message.imageCaption}
          </Text>
        </View>
      ) : null}
      {message.isMine && (
        <View
          style={{
            position: "absolute",
            bottom: message.imageCaption ? 8 : 6,
            right: 10,
          }}
        >
          <MessageStatus status={message.status} />
        </View>
      )}
      <Text
        style={{
          fontSize: 12,
          color: colors.textSecondary,
          backgroundColor: colors.backgroundSecondary,
          paddingVertical: 4,
          paddingHorizontal: 6,
          borderRadius: 8,
          position: "absolute",
          bottom: 6,
          left: 8,
        }}
      >
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

// ── Link preview bubble ──────────────────────────────────────
function LinkPreviewBubble({ message }: { message: Message }) {
  const { colors } = useTheme();
  const lp = message.linkPreview!;

  const handleOpen = () => Linking.openURL(lp.url).catch(() => null);

  return (
    <View style={{ maxWidth: "78%", gap: 6 }}>
      {/* Raw text with link */}
      {message.text ? (
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 16,
            borderBottomLeftRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 14 }}>
            {message.text}
          </Text>
        </View>
      ) : null}
      {/* Preview card */}
      <TouchableOpacity
        onPress={handleOpen}
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 14,
          overflow: "hidden",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {lp.thumbnailUri && (
          <Image
            source={{ uri: lp.thumbnailUri }}
            style={{ width: 56, height: 56 }}
            resizeMode="cover"
          />
        )}
        <View style={{ flex: 1, padding: 10 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 13,
              fontWeight: "600",
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {lp.title}
          </Text>
          {lp.siteName && (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 11,
                marginTop: 2,
              }}
            >
              {lp.siteName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

// ── File bubble ──────────────────────────────────────────────
function FileBubble({ message }: { message: Message }) {
  const { colors } = useTheme();

  const handleDownload = () => {
    if (message.fileUri) {
      Linking.openURL(message.fileUri).catch(() => {
        console.error("Failed to open file");
      });
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <TouchableOpacity
      onPress={handleDownload}
      style={{
        maxWidth: "78%",
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 14,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <MaterialCommunityIcons
        name="file-document-outline"
        size={32}
        color={colors.primary}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: "600",
            lineHeight: 18,
          }}
          numberOfLines={1}
        >
          {message.fileName}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {formatFileSize(message.fileSize)}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="download"
        size={20}
        color={colors.primary}
      />
    </TouchableOpacity>
  );
}

// ── Video preview bubble ─────────────────────────────────────
function VideoPreviewBubble({ message }: { message: Message }) {
  const { colors } = useTheme();
  const vp = message.videoPreview!;

  const handleOpen = () => Linking.openURL(vp.url).catch(() => null);

  return (
    <View style={{ maxWidth: "78%", gap: 6 }}>
      {/* Thumbnail */}
      <TouchableOpacity
        onPress={handleOpen}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        {vp.thumbnailUri && (
          <Image
            source={{ uri: vp.thumbnailUri }}
            style={{ width: 240, height: 135 }}
            resizeMode="cover"
          />
        )}
        {/* Play button overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="play" size={22} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Metadata */}
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 14,
          padding: 10,
          gap: 2,
        }}
      >
        {vp.channel && (
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {vp.channel}
          </Text>
        )}
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {vp.title}
        </Text>
        {vp.description && (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              lineHeight: 17,
            }}
            numberOfLines={2}
          >
            {vp.description}
          </Text>
        )}
      </View>
      {/* Caption with link */}
      {message.text && (
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 14,
            borderBottomLeftRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 13 }}>
            {message.text}
          </Text>
        </View>
      )}
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

// ── Sender avatar (left side) ────────────────────────────────
function SenderAvatar({
  avatarUri,
  name,
  visible,
}: {
  avatarUri?: string;
  name?: string;
  visible: boolean;
}) {
  const { colors } = useTheme();
  if (!visible) {
    // Invisible spacer so bubbles stay aligned
    return <View style={{ width: AVATAR_SIZE, marginRight: 8 }} />;
  }
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <View
      style={{
        width: AVATAR_SIZE,
        marginRight: 8,
        alignSelf: "flex-end",
      }}
    >
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
          }}
        />
      ) : (
        <View
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Main export ──────────────────────────────────────────────
interface MessageBubbleProps {
  message: Message;
  /** Show sender avatar (only for received messages, last in a group) */
  showAvatar?: boolean;
  /** URI of the sender's avatar photo */
  avatarUri?: string;
  /** Sender display name (used for initials fallback) */
  senderName?: string;
}

const SENT_BG = "#00B14F";
const SENT_TEXT = "#FFFFFF";

export default function MessageBubble({
  message,
  showAvatar = false,
  avatarUri,
  senderName,
}: MessageBubbleProps) {
  const { colors } = useTheme();

  const receivedBg = colors.backgroundSecondary;
  const receivedText = colors.text;

  const renderContent = () => {
    switch (message.type) {
      case "IMAGE":
        return <ImageBubble message={message} />;
      case "FILE":
        return <FileBubble message={message} />;
      case "LINK_PREVIEW":
        return <LinkPreviewBubble message={message} />;
      case "VIDEO_PREVIEW":
        return <VideoPreviewBubble message={message} />;
      default:
        return (
          <TextBubble
            message={message}
            bubbleBg={message.isMine ? SENT_BG : receivedBg}
            textColor={message.isMine ? SENT_TEXT : receivedText}
          />
        );
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: message.isMine ? "flex-end" : "flex-start",
        alignItems: "flex-end",
        paddingHorizontal: 12,
        marginBottom: 4,
      }}
    >
      {/* Avatar slot — only rendered for received messages */}
      {!message.isMine && (
        <SenderAvatar
          avatarUri={avatarUri}
          name={senderName}
          visible={showAvatar}
        />
      )}
      {renderContent()}
      {message.isMine && (
        <View style={{ alignItems: "flex-end", marginTop: 2, marginLeft: 4 }}>
          <MessageStatus status={message.status} />
        </View>
      )}
    </View>
  );
}
