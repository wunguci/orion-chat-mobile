import { formatTime } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { Message } from "@/types/chat";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useContext, useRef } from "react";
import { GroupCallContext } from "@/context/GroupCallContext";
import { CallContext } from "@/context/CallContext";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import MessageReactions from "./MessageReactions";
import {
  downloadFileDirectly,
  showDownloadAlert,
} from "@/utils/directFileDownload";
import { Reply } from "lucide-react-native";

const AVATAR_SIZE = 32;
const HIGHLIGHT_BORDER_COLOR = "rgba(0, 177, 79, 0.28)";

// ── Status checkmarks ────────────────────────────────────────
function PinnedBadge({ isMine }: { isMine?: boolean }) {
  const { colors } = useTheme();
  const badgeColor = isMine ? "rgba(255,255,255,0.92)" : colors.primary;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 5,
      }}
    >
      <MaterialCommunityIcons
        name="pin-outline"
        size={12}
        color={badgeColor}
      />
      <Text
        style={{
          color: badgeColor,
          fontSize: 12,
          fontWeight: "700",
        }}
      >
        Pinned
      </Text>
    </View>
  );
}

function MessageStatus({ status }: { status?: Message["status"] }) {
  const { colors } = useTheme();

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
      <MaterialCommunityIcons
        name="check-all"
        size={14}
        color={colors.primary}
      />
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

function ReplyPreviewInBubble({
  message,
  onPress,
}: {
  message: Message;
  onPress?: (messageId: string) => void;
}) {
  const { colors } = useTheme();
  const preview = message.replyToMessagePreview;

  if (!message.replyToMessageId && !preview) return null;
  const targetMessageId = message.replyToMessageId || preview?.messageId;

  const senderName = preview?.senderName || "message";
  const snippet = preview?.snippet || preview?.content || "Attachment";

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={!targetMessageId}
      onPress={() => {
        if (targetMessageId) {
          onPress?.(targetMessageId);
        }
      }}
      style={{
        marginBottom: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderLeftWidth: 3,
        borderLeftColor: message.isMine ? "#FFFFFF" : colors.primary,
        borderRadius: 8,
        backgroundColor: message.isMine
          ? "rgba(255,255,255,0.18)"
          : colors.primaryLight,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 3,
          gap: 5,
        }}
      >
        {/* <MaterialCommunityIcons
          name="reply"
          size={14}
          color={message.isMine ? "#FFFFFF" : colors.primary}
        /> */}
        <View
          style={{
            width: 16,
            height: 16,
            transform: [{ rotate: "180deg" }],
          }}
        >
          <Reply
            size={14}
            color={message.isMine ? "#FFFFFF" : colors.primary}
            strokeWidth={2.4}
          />
        </View>

        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: message.isMine ? "#FFFFFF" : colors.primaryDark,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          Reply to {senderName}
        </Text>
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: message.isMine
            ? "rgba(255,255,255,0.85)"
            : colors.primaryDark,
          fontSize: 12,
        }}
      >
        {snippet}
      </Text>
    </TouchableOpacity>
  );
}

// ── Text bubble ──────────────────────────────────────────────
function TextBubble({
  message,
  bubbleBg,
  textColor,
  onReplyPreviewPress,
  isHighlighted = false,
  participants = [],
  currentUserId,
}: {
  message: Message;
  bubbleBg: string;
  textColor: string;
  onReplyPreviewPress?: (messageId: string) => void;
  isHighlighted?: boolean;
  participants?: any[];
  currentUserId?: string;
}) {
  const { colors } = useTheme();

  if (message.isRecalled) {
    return (
      <View style={{ maxWidth: "78%" }}>
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 18,
            borderBottomRightRadius: message.isMine ? 4 : 18,
            borderBottomLeftRadius: message.isMine ? 18 : 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {message.text}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        <MessageReactions reactions={message.reactions} />
      </View>
    );
  }

  return (
    <View style={{ maxWidth: "78%" }}>
      <View
        style={{
          backgroundColor: bubbleBg,
          borderRadius: 18,
          borderBottomRightRadius: message.isMine ? 4 : 18,
          borderBottomLeftRadius: message.isMine ? 18 : 4,
          borderWidth: 1.2,
          borderColor: isHighlighted ? HIGHLIGHT_BORDER_COLOR : "transparent",
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <ReplyPreviewInBubble message={message} onPress={onReplyPreviewPress} />

        {message.isPinned ? <PinnedBadge isMine={message.isMine} /> : null}

        {(() => {
          if (!message.text) return null;
          if (!participants || participants.length === 0) {
            return (
              <Text style={{ color: textColor, fontSize: 15, lineHeight: 21 }}>
                {message.text}
              </Text>
            );
          }
          const names = participants
            .filter((p) => p.userId !== currentUserId)
            .map((p) => p.fullName)
            .filter(Boolean)
            .sort((a, b) => b.length - a.length);
          const escapedNames = names.map((name) =>
            name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          );
          escapedNames.push("all");
          escapedNames.push("tất cả");
          if (escapedNames.length === 0) {
            return (
              <Text style={{ color: textColor, fontSize: 15, lineHeight: 21 }}>
                {message.text}
              </Text>
            );
          }
          const pattern = new RegExp(`(@(?:${escapedNames.join("|")}))`, "gi");
          const parts = message.text.split(pattern);
          return (
            <Text style={{ color: textColor, fontSize: 15, lineHeight: 21 }}>
              {parts.map((part, index) => {
                if (index % 2 === 1) {
                  // highlight mention (split with capturing group puts matches at odd indices)
                  return (
                    <Text
                      key={index}
                      style={{
                        color: message.isMine ? "#fff" : colors.primary,
                        fontWeight: "bold",
                      }}
                    >
                      {part}
                    </Text>
                  );
                }
                return <Text key={index}>{part}</Text>;
              })}
            </Text>
          );
        })()}

        <Text
          style={{
            fontSize: 12,
            color: message.isMine ? "rgba(255,255,255,0.78)" : colors.textSecondary,
          }}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
      <MessageReactions reactions={message.reactions} />
    </View>
  );
}

// ── Video bubble ─────────────────────────────────────────────
function VideoBubble({
  message,
  onLongPress,
  isHighlighted = false,
}: {
  message: Message;
  onLongPress?: (message: Message) => void;
  isHighlighted?: boolean;
}) {
  const { colors } = useTheme();
  const [showVideo, setShowVideo] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // If message is recalled, show recalled state FIRST (before checking videoUri)
  if (message.isRecalled) {
    return (
      <View style={{ maxWidth: "78%" }}>
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 18,
            borderBottomRightRadius: message.isMine ? 4 : 18,
            borderBottomLeftRadius: message.isMine ? 18 : 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {message.text || "[Message has been recalled]"}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        <MessageReactions reactions={message.reactions} />
      </View>
    );
  }

  const videoUri = message.videoUri;
  if (!videoUri) {
    return null;
  }

  const videoMimeType = message.fileMimeType || "video/mp4";
  const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                html, body { margin: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
                video { width: 100%; height: 100%; object-fit: contain; background: #000; }
                button { position: fixed; top: 18px; right: 18px; z-index: 2; width: 44px; height: 44px; border-radius: 22px; border: 0; background: rgba(255,255,255,.9); font-size: 28px; }
            </style>
        </head>
        <body>
            <video controls autoplay playsinline>
                <source src=${JSON.stringify(videoUri)} type=${JSON.stringify(videoMimeType)}>
            </video>
            <button onclick="window.ReactNativeWebView.postMessage('close')">&times;</button>
        </body>
        </html>
    `;

  // If showing full video, display WebView with HTML5 video player
  if (false && showVideo) {
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        background-color: #000;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        width: 100vw;
                        overflow: hidden;
                    }
                    .video-container {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: #000;
                    }
                    video {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        background: #000;
                    }
                    video::-webkit-media-controls {
                        display: block !important;
                    }
                    .close-btn {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: rgba(255,255,255,0.9);
                        border: none;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        font-size: 32px;
                        cursor: pointer;
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                    .close-btn:active {
                        background: rgba(255,255,255,0.8);
                    }
                </style>
            </head>
            <body>
                <div class="video-container">
                    <video 
                        controls 
                        autoplay
                        style="width: 100%; height: 100%;"
                    >
                        <source src="${videoUri}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                <button class="close-btn" onclick="window.ReactNativeWebView.postMessage('close')">✕</button>
            </body>
            </html>
        `;

    return (
      <View
        style={{
          flex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: "#000",
        }}
      >
        <WebView
          source={{ html: htmlContent }}
          onMessage={(event) => {
            if (event.nativeEvent.data === "close") {
              setShowVideo(false);
            }
          }}
          startInLoadingState
          style={{ flex: 1 }}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
        />
      </View>
    );
  }

  // Show thumbnail with play button - similar to screenshot
  return (
    <View style={{ maxWidth: "78%" }}>
      <Modal
        visible={showVideo}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowVideo(false)}
      >
        <SafeAreaView
          edges={["top", "bottom"]}
          style={{ flex: 1, backgroundColor: "#000" }}
        >
          <WebView
            source={{ html: htmlContent }}
            onMessage={(event) => {
              if (event.nativeEvent.data === "close") {
                setShowVideo(false);
              }
            }}
            startInLoadingState
            style={{ flex: 1, backgroundColor: "#000" }}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
          />
        </SafeAreaView>
      </Modal>
      <TouchableOpacity
        onPress={() => {
          if (!isLongPressing) {
            setShowVideo(true);
          }
        }}
        onLongPress={() => {
          setIsLongPressing(true);
          onLongPress?.(message);
        }}
        onPressOut={() => setIsLongPressing(false)}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#000",
          width: 240,
          height: 180,
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Thumbnail - use first frame */}
        <Image
          source={{ uri: videoUri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        {/* Play button overlay - centered */}
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
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "rgba(255,255,255,0.85)",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons
              name="play"
              size={32}
              color="#000"
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>

        {isHighlighted ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              bottom: 1,
              left: 1,
              borderWidth: 2,
              borderColor: HIGHLIGHT_BORDER_COLOR,
              borderRadius: 11,
              zIndex: 10,
            }}
          />
        ) : null}

        {/* Video controls overlay at bottom */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="play" size={14} color="#fff" />
            {message.videoDuration ? (
              <Text style={{ fontSize: 11, color: "#fff", flex: 1 }}>
                0:00 / {Math.floor((message.videoDuration / 1000) % 60)}s
              </Text>
            ) : (
              <Text style={{ fontSize: 11, color: "#fff", flex: 1 }}>
                Video
              </Text>
            )}
            <Ionicons name="volume-high" size={14} color="#fff" />
            <Ionicons name="expand" size={14} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>

      <MessageReactions reactions={message.reactions} />
    </View>
  );
}

// ── Image bubble ─────────────────────────────────────────────
function ImageBubble({
  message,
  isHighlighted = false,
  onImagePress,
  onLongPress,
}: {
  message: Message;
  isHighlighted?: boolean;
  onImagePress?: (message: Message) => void;
  onLongPress?: (message: Message) => void;
}) {
  const { colors } = useTheme();

  // If message is recalled, show recalled state
  if (message.isRecalled) {
    return (
      <View style={{ maxWidth: "78%" }}>
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 18,
            borderBottomRightRadius: message.isMine ? 4 : 18,
            borderBottomLeftRadius: message.isMine ? 18 : 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {message.text || "[Message has been recalled]"}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        <MessageReactions reactions={message.reactions} />
      </View>
    );
  }

  return (
    <View style={{ maxWidth: "78%" }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onImagePress?.(message)}
        onLongPress={() => onLongPress?.(message)}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: colors.card,
          position: "relative",
        }}
      >
        <Image
          source={{ uri: message.imageUri }}
          style={{ width: 240, height: 180 }}
          resizeMode="cover"
        />
        {isHighlighted ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              bottom: 1,
              left: 1,
              borderWidth: 2,
              borderColor: HIGHLIGHT_BORDER_COLOR,
              borderRadius: 15,
              zIndex: 10,
            }}
          />
        ) : null}

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
      </TouchableOpacity>
      <MessageReactions reactions={message.reactions} />
    </View>
  );
}

function ImageGroupBubble({
  messages,
  isHighlighted = false,
  onImagePress,
}: {
  messages: Message[];
  isHighlighted?: boolean;
  onImagePress?: (message: Message) => void;
}) {
  const { colors } = useTheme();
  const count = messages.length;
  const columns = count <= 3 ? count : count === 4 ? 2 : 3;
  const gap = 3;
  const gridWidth = 240;
  const tileSize = (gridWidth - gap * (columns - 1)) / columns;
  const lastMessage = messages[messages.length - 1];

  return (
    <View style={{ maxWidth: "78%" }}>
      <View
        style={{
          width: gridWidth,
          flexDirection: "row",
          flexWrap: "wrap",
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: colors.card,
          position: "relative",
        }}
      >
        {messages.map((message, index) => {
          const row = Math.floor(index / columns);
          const rowCount = Math.ceil(count / columns);
          const isEndOfRow = (index + 1) % columns === 0 || index === count - 1;

          return (
            <TouchableOpacity
              key={message.id}
              style={{
                width: tileSize,
                height: tileSize,
                marginRight: isEndOfRow ? 0 : gap,
                marginBottom: row < rowCount - 1 ? gap : 0,
                backgroundColor: colors.backgroundSecondary,
              }}
              activeOpacity={0.9}
              onPress={() => onImagePress?.(message)}
            >
              <Image
                source={{ uri: message.imageUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        })}
        {isHighlighted ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              bottom: 1,
              left: 1,
              borderWidth: 2,
              borderColor: HIGHLIGHT_BORDER_COLOR,
              borderRadius: 15,
              zIndex: 10,
            }}
          />
        ) : null}
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
          {formatTime(lastMessage.timestamp)}
        </Text>
      </View>
    </View>
  );
}

// ── Link preview bubble ──────────────────────────────────────
function LinkPreviewBubble({
  message,
  isHighlighted = false,
}: {
  message: Message;
  isHighlighted?: boolean;
}) {
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
          borderWidth: 1.2,
          borderColor: isHighlighted ? HIGHLIGHT_BORDER_COLOR : "transparent",
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
      <MessageReactions reactions={message.reactions} />
    </View>
  );
}

// ── File bubble ──────────────────────────────────────────────
function FileBubble({
  message,
  onLongPress,
  isHighlighted = false,
}: {
  message: Message;
  onLongPress?: (message: Message) => void;
  isHighlighted?: boolean;
}) {
  const { colors } = useTheme();
  const [isLongPressing, setIsLongPressing] = useState(false);

  // If message is recalled, show recalled state
  if (message.isRecalled) {
    return (
      <View style={{ maxWidth: "75%" }}>
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 18,
            borderBottomRightRadius: message.isMine ? 4 : 18,
            borderBottomLeftRadius: message.isMine ? 18 : 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {message.text || "[Message has been recalled]"}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        <MessageReactions reactions={message.reactions} />
      </View>
    );
  }

  const handleDownload = async () => {
    // console.log("[FileBubble] Download clicked:", {
    //   fileName: message.fileName,
    //   fileUri: message.fileUri,
    // });

    if (!message.fileUri) {
      Alert.alert("Error", "No file link available");
      return;
    }

    // Trigger direct download (không dùng Share dialog)
    const result = await downloadFileDirectly(
      message.fileUri,
      message.fileName || "file",
    );

    // Show result
    showDownloadAlert(result);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getFileIcon = (): any => {
    const extension = (message.fileName || "").split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "file-pdf-box";
      case "doc":
      case "docx":
        return "file-word-box";
      case "xls":
      case "xlsx":
        return "file-excel-box";
      case "ppt":
      case "pptx":
        return "file-powerpoint-box";
      case "zip":
      case "rar":
      case "7z":
        return "file-archive";
      case "mp4":
      case "avi":
      case "mov":
      case "mkv":
        return "file-video-box";
      case "mp3":
      case "wav":
      case "flac":
        return "file-music-box";
      case "txt":
        return "file-document-outline";
      default:
        return "file-outline";
    }
  };

  return (
    <View style={{ maxWidth: "100%", gap: 6, width: "75%" }}>
      <TouchableOpacity
        onPress={() => {
          if (!isLongPressing) handleDownload();
        }}
        onLongPress={() => {
          setIsLongPressing(true);
          onLongPress?.(message);
        }}
        onPressOut={() => setIsLongPressing(false)}
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 14,
          borderWidth: 1.2,
          borderColor: isHighlighted ? HIGHLIGHT_BORDER_COLOR : "transparent",
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <MaterialCommunityIcons
          name={getFileIcon()}
          size={28}
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
            {message.fileName || message.text || "Unknown File"}
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
      <MessageReactions reactions={message.reactions} />
    </View>
  );
}

// ── Video preview bubble ─────────────────────────────────────
function VideoPreviewBubble({
  message,
  isHighlighted = false,
}: {
  message: Message;
  isHighlighted?: boolean;
}) {
  const { colors } = useTheme();

  // Handle both videoPreview object (for link previews) and videoUri (for video attachments)
  const videoUrl = message.videoPreview?.url || message.videoUri;
  const thumbnailUri =
    message.videoPreview?.thumbnailUri || message.videoThumbnailUri;
  const title = message.videoPreview?.title || message.text || "Video";
  const channel = message.videoPreview?.channel;

  if (!videoUrl) {
    return null; // Don't render if no URL
  }

  const handleOpen = () => Linking.openURL(videoUrl).catch(() => null);

  return (
    <View style={{ maxWidth: "78%", gap: 6 }}>
      {/* Thumbnail */}
      <TouchableOpacity
        onPress={handleOpen}
        style={{
          borderRadius: 16,
          borderWidth: 1.2,
          borderColor: isHighlighted ? HIGHLIGHT_BORDER_COLOR : "transparent",
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        {thumbnailUri && (
          <Image
            source={{ uri: thumbnailUri }}
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
        {channel && (
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {channel}
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
          {title}
        </Text>
        {message.videoPreview?.description && (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              lineHeight: 17,
            }}
            numberOfLines={2}
          >
            {message.videoPreview.description}
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
      <MessageReactions reactions={message.reactions} />
    </View>
  );
}

// ── Call history bubble ──────────────────────────────────────
function CallBubble({
  message,
  onCallBack,
  isHighlighted = false,
}: {
  message: Message;
  onCallBack?: (callType: "audio" | "video") => void;
  isHighlighted?: boolean;
}) {
  const { colors } = useTheme();
  const groupCallContext = useContext(GroupCallContext);

  const callData = message.callData;
  if (!callData) {
    return (
      <View
        style={{
          padding: 12,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 14,
        }}
      >
        <Text style={{ color: colors.text }}>Call</Text>
      </View>
    );
  }

  const { callType, callStatus, duration, callId, callMode } = callData;
  const isVideo = callType === "video";
  const isMe = message.isMine;

  const handleJoin = async () => {
    if (!callId) return;
    try {
      if (groupCallContext && groupCallContext.joinGroupCall) {
        await groupCallContext.joinGroupCall(callId, message.chatId, callType);
      }
    } catch (error) {
      console.error("[CallBubble] Join call failed:", error);
      Alert.alert("Error", "Cannot join group call");
    }
  };

  // Formatter cho thời lượng cuộc gọi
  const formatDurationText = (seconds?: number) => {
    if (seconds === undefined) return "0 min";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0 && secs === 0) return "0 min";
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  if (callStatus === "active") {
    return (
      <View
        style={{
          backgroundColor: colors.primaryLight,
          borderWidth: 1,
          borderColor: isHighlighted ? HIGHLIGHT_BORDER_COLOR : colors.primary,
          borderRadius: 16,
          padding: 14,
          width: 240,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={isVideo ? "videocam" : "call"}
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#4C1D95", fontWeight: "700", fontSize: 14 }}>
              Group Call
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.success,
                }}
              />
              <Text
                style={{
                  color: colors.primaryDark,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Ongoing...
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleJoin}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingVertical: 8,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
          }}
        >
          <Ionicons name="enter-outline" size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
            Join
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  let cardBg = isMe ? colors.chatBubbleSent : colors.backgroundSecondary;
  let titleColor = isMe ? "#FFFFFF" : colors.text;
  let descColor = isMe ? "rgba(255, 255, 255, 0.8)" : colors.textSecondary;
  let iconBg = "";
  let iconColor = "";
  let iconName: any = isVideo ? "videocam" : "call";
  let titleText = "";
  let statusText = "";

  if (callMode === "group") {
    titleText = "Group Call";
    if (callStatus === "completed") {
      statusText = `Ended · ${formatDurationText(duration)}`;
      iconColor = isMe ? "#FFFFFF" : colors.success;
      iconBg = isMe ? "rgba(255, 255, 255, 0.25)" : "#E6F4EA";
    } else {
      statusText = "Ended";
      titleColor = isMe ? "#FFFFFF" : "#DC2626";
      iconColor = isMe ? "#FFFFFF" : "#DC2626";
      iconBg = isMe ? "rgba(255, 255, 255, 0.25)" : "#FEE2E2";
      iconName = isVideo ? "videocam-off" : "call-outline";
    }
  } else {
    if (callStatus === "completed") {
      titleText = `${isMe ? "Outgoing" : "Incoming"} ${isVideo ? "Video" : "Voice"} Call`;
      statusText = formatDurationText(duration);
      iconColor = isMe ? "#FFFFFF" : colors.success;
      iconBg = isMe ? "rgba(255, 255, 255, 0.25)" : "#E6F4EA";
    } else if (callStatus === "missed") {
      titleText = isMe ? "Canceled by you" : "Missed Call";
      statusText = "Missed call";
      titleColor = isMe ? "#FFFFFF" : "#DC2626";
      iconColor = isMe ? "#FFFFFF" : "#DC2626";
      iconBg = isMe ? "rgba(255, 255, 255, 0.25)" : "#FEE2E2";
      iconName = isVideo ? "videocam-off" : "call-outline";
    } else if (callStatus === "declined") {
      titleText = isMe ? "Declined by recipient" : "Declined by you";
      statusText = "Call declined";
      titleColor = isMe ? "#FFFFFF" : "#DC2626";
      iconColor = isMe ? "#FFFFFF" : "#DC2626";
      iconBg = isMe ? "rgba(255, 255, 255, 0.25)" : "#FEE2E2";
      iconName = isVideo ? "videocam-off" : "call-outline";
    }
  }

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 16,
        borderWidth: 1.2,
        borderColor: isHighlighted ? HIGHLIGHT_BORDER_COLOR : "transparent",
        padding: 12,
        gap: 10,
        width: 240,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: iconBg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: titleColor, fontWeight: "600", fontSize: 13 }}
            numberOfLines={1}
          >
            {titleText}
          </Text>
          <Text style={{ color: descColor, fontSize: 11, marginTop: 2 }}>
            {statusText}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => onCallBack?.(callType)}
        activeOpacity={0.8}
        style={{
          backgroundColor: isMe ? "rgba(255, 255, 255, 0.2)" : colors.primary,
          borderRadius: 10,
          paddingVertical: 8,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: isMe ? 1 : 0,
          borderColor: isMe ? "rgba(255, 255, 255, 0.4)" : "transparent",
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontWeight: "700",
            fontSize: 13,
          }}
        >
          Call Back
        </Text>
      </TouchableOpacity>
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
  imageGroup?: Message[];
  // Highlight lúc direct tới bằng click
  isHighlighted?: boolean;
  showAvatar?: boolean;
  avatarUri?: string;
  senderName?: string;
  onLongPress?: (message: Message) => void;
  onCallBack?: (callType: "audio" | "video") => void;
  onReply?: (message: Message) => void;
  onReplyPreviewPress?: (messageId: string) => void;
  onImagePress?: (message: Message) => void;
  participants?: { userId: string; fullName: string; avatarUrl?: string }[];
  currentUserId?: string;
}

const SENT_TEXT = "#FFFFFF";

export default function MessageBubble({
  message,
  imageGroup,
  isHighlighted = false,
  showAvatar = false,
  avatarUri,
  senderName,
  onLongPress,
  onCallBack,
  onReply,
  onReplyPreviewPress,
  onImagePress,
  participants = [],
  currentUserId,
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const swipeableRef = useRef<Swipeable | null>(null);

  const receivedBg = colors.backgroundSecondary;
  const receivedText = colors.text;
  const sentBg = colors.chatBubbleSent || colors.primary;

  const messageType = String(message.type || "").toUpperCase();
  const handleImagePress = (targetMessage: Message) => {
    if (onImagePress) {
      onImagePress(targetMessage);
      return;
    }

    if (targetMessage.imageUri) {
      setFullscreenImageUri(targetMessage.imageUri);
    }
  };

  if (messageType === "SYSTEM") {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
          paddingVertical: 6,
          marginVertical: 4,
          width: "100%",
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(30, 41, 59, 0.85)",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 6,
            maxWidth: "85%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Text
            style={{
              color: "#F1F5F9",
              fontSize: 12,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {message.text}
          </Text>
        </View>
      </View>
    );
  }

  const renderContent = () => {
    if (imageGroup && imageGroup.length > 1) {
      return (
        <ImageGroupBubble
          messages={imageGroup}
          isHighlighted={isHighlighted}
          onImagePress={handleImagePress}
        />
      );
    }

    const messageType = String(message.type || "").toUpperCase();
    const isMentioned = Boolean(
      !message.isMine &&
        !message.isRecalled &&
        currentUserId &&
        (message.mentionAll || (message.mentions && message.mentions.includes(currentUserId)))
    );

    switch (messageType) {
      case "IMAGE":
        return (
          <ImageBubble
            message={message}
            isHighlighted={isHighlighted}
            onImagePress={handleImagePress}
            onLongPress={onLongPress}
          />
        );
      case "FILE":
        return (
          <FileBubble
            message={message}
            onLongPress={onLongPress}
            isHighlighted={isHighlighted}
          />
        );
      case "LINK_PREVIEW":
        return (
          <LinkPreviewBubble
            message={message}
            isHighlighted={isHighlighted}
          />
        );
      case "VIDEO":
        // Video file attachment
        return (
          <VideoBubble
            message={message}
            onLongPress={onLongPress}
            isHighlighted={isHighlighted}
          />
        );
      case "VIDEO_PREVIEW":
        // YouTube/video preview link
        return (
          <VideoPreviewBubble
            message={message}
            isHighlighted={isHighlighted}
          />
        );
      case "CALL":
        return (
          <CallBubble
            message={message}
            onCallBack={onCallBack}
            isHighlighted={isHighlighted}
          />
        );
      default:
        return (
          <TextBubble
            message={message}
            bubbleBg={message.isMine ? sentBg : receivedBg}
            textColor={message.isMine ? SENT_TEXT : receivedText}
            onReplyPreviewPress={onReplyPreviewPress}
            isHighlighted={isHighlighted}
            participants={participants}
            currentUserId={currentUserId}
          />
        );
    }
  };

  const messageNode = (
    <Pressable
      onLongPress={() => onLongPress?.(message)}
      delayLongPress={500}
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    >
      <View>
        {/* Show tên trên group msg */}
        {!message.isMine && senderName && (
          <Text
            style={{
              marginLeft: AVATAR_SIZE + 8,
              marginBottom: 2,
              fontSize: 12,
              fontWeight: "600",
              color: colors.textSecondary,
            }}
          >
            {senderName}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            justifyContent: message.isMine ? "flex-end" : "flex-start",
            alignItems: "flex-end",
            paddingHorizontal: 12,
            marginBottom: 4,
          }}
        >
          {/* Avatar — chỉ render dv msg nhận */}
          {!message.isMine && (
            <SenderAvatar
              avatarUri={avatarUri}
              name={senderName}
              visible={showAvatar}
            />
          )}
          {renderContent()}
          {message.isMine && (
            <View
              style={{
                alignItems: "flex-end",
                marginTop: 2,
                marginLeft: 4,
              }}
            >
              <MessageStatus status={message.status} />
            </View>
          )}
        </View>
      </View>

      {/* Fullscreen Image Viewer Modal */}
      <Modal
        visible={!!fullscreenImageUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenImageUri(null)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Close Button at top-right */}
          <TouchableOpacity
            onPress={() => setFullscreenImageUri(null)}
            style={{
              position: "absolute",
              top: Platform.OS === "ios" ? 50 : 20,
              right: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Full Screen Image */}
          {fullscreenImageUri ? (
            <Image
              source={{ uri: fullscreenImageUri }}
              style={{
                width: "100%",
                height: "80%",
              }}
              resizeMode="contain"
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </Pressable>
  );

  if (!onReply || message.isRecalled) {
    return messageNode;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={() => (
        <View
          style={{
            width: 76,
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 8,
            backgroundColor: colors.primaryLight,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name="reply" size={22} color="#FFFFFF" />
          </View>
          <Text
            style={{
              marginTop: 4,
              color: colors.primaryDark,
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            Reply
          </Text>
        </View>
      )}
      friction={1}
      rightThreshold={24}
      dragOffsetFromRightEdge={8}
      overshootRight={false}
      onSwipeableOpen={() => {
        swipeableRef.current?.close();
        onReply(message);
      }}
    >
      {messageNode}
    </Swipeable>
  );
}
