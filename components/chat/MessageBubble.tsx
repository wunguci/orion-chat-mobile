import { formatTime } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';
import { Message } from '@/types/chat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    Linking,
    Pressable,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import MessageReactions from './MessageReactions';
import {
    downloadFileDirectly,
    showDownloadAlert,
} from '@/utils/directFileDownload';

const AVATAR_SIZE = 32;

// ── Status checkmarks ────────────────────────────────────────
function MessageStatus({ status }: { status?: Message['status'] }) {
    if (!status) return null;
    if (status === 'sending') {
        return (
            <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color="rgba(255,255,255,0.6)"
            />
        );
    }
    if (status === 'read') {
        return (
            <MaterialCommunityIcons
                name="check-all"
                size={14}
                color="#00B14F"
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

    if (message.isRecalled) {
        return (
            <View style={{ maxWidth: '78%' }}>
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
        <View style={{ maxWidth: '78%' }}>
            <View
                style={{
                    backgroundColor: bubbleBg,
                    borderRadius: 18,
                    borderBottomRightRadius: message.isMine ? 4 : 18,
                    borderBottomLeftRadius: message.isMine ? 18 : 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                }}
            >
                <Text
                    style={{ color: textColor, fontSize: 15, lineHeight: 21 }}
                >
                    {message.text}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
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
}: {
    message: Message;
    onLongPress?: (message: Message) => void;
}) {
    const { colors } = useTheme();
    const [showVideo, setShowVideo] = useState(false);
    const [isLongPressing, setIsLongPressing] = useState(false);

    // If message is recalled, show recalled state FIRST (before checking videoUri)
    if (message.isRecalled) {
        return (
            <View style={{ maxWidth: '78%' }}>
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
                        {message.text || '[Tin nhắn đã bị thu hồi]'}
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

    // If showing full video, display WebView with HTML5 video player
    if (showVideo) {
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
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
                    backgroundColor: '#000',
                }}
            >
                <WebView
                    source={{ html: htmlContent }}
                    onMessage={(event) => {
                        if (event.nativeEvent.data === 'close') {
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
        <View style={{ maxWidth: '78%' }}>
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
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    width: 240,
                    height: 180,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {/* Thumbnail - use first frame */}
                <Image
                    source={{ uri: videoUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
                {/* Play button overlay - centered */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: 'rgba(255,255,255,0.85)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#000',
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

                {/* Video controls overlay at bottom */}
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Ionicons name="play" size={14} color="#fff" />
                        {message.videoDuration ? (
                            <Text
                                style={{ fontSize: 11, color: '#fff', flex: 1 }}
                            >
                                0:00 /{' '}
                                {Math.floor(
                                    (message.videoDuration / 1000) % 60,
                                )}
                                s
                            </Text>
                        ) : (
                            <Text
                                style={{ fontSize: 11, color: '#fff', flex: 1 }}
                            >
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
function ImageBubble({ message }: { message: Message }) {
    const { colors } = useTheme();

    // If message is recalled, show recalled state
    if (message.isRecalled) {
        return (
            <View style={{ maxWidth: '78%' }}>
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
                        {message.text || '[Tin nhắn đã bị thu hồi]'}
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
        <View style={{ maxWidth: '78%' }}>
            <View
                style={{
                    borderRadius: 16,
                    overflow: 'hidden',
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
                            position: 'absolute',
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
                        position: 'absolute',
                        bottom: 6,
                        left: 8,
                    }}
                >
                    {formatTime(message.timestamp)}
                </Text>
            </View>
            <MessageReactions reactions={message.reactions} />
        </View>
    );
}

// ── Link preview bubble ──────────────────────────────────────
function LinkPreviewBubble({ message }: { message: Message }) {
    const { colors } = useTheme();
    const lp = message.linkPreview!;

    const handleOpen = () => Linking.openURL(lp.url).catch(() => null);

    return (
        <View style={{ maxWidth: '78%', gap: 6 }}>
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
                    overflow: 'hidden',
                    flexDirection: 'row',
                    alignItems: 'center',
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
                            fontWeight: '600',
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
}: {
    message: Message;
    onLongPress?: (message: Message) => void;
}) {
    const { colors } = useTheme();
    const [isLongPressing, setIsLongPressing] = useState(false);

    // If message is recalled, show recalled state
    if (message.isRecalled) {
        return (
            <View style={{ maxWidth: '75%' }}>
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
                        {message.text || '[Tin nhắn đã bị thu hồi]'}
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
        console.log('[FileBubble] Download clicked:', {
            fileName: message.fileName,
            fileUri: message.fileUri,
        });

        if (!message.fileUri) {
            Alert.alert('Lỗi', 'Không có liên kết file');
            return;
        }

        // Trigger direct download (không dùng Share dialog)
        const result = await downloadFileDirectly(
            message.fileUri,
            message.fileName || 'file',
        );

        // Show result
        showDownloadAlert(result);
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    const getFileIcon = (): any => {
        const extension = (message.fileName || '')
            .split('.')
            .pop()
            ?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return 'file-pdf-box';
            case 'doc':
            case 'docx':
                return 'file-word-box';
            case 'xls':
            case 'xlsx':
                return 'file-excel-box';
            case 'ppt':
            case 'pptx':
                return 'file-powerpoint-box';
            case 'zip':
            case 'rar':
            case '7z':
                return 'file-archive';
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'mkv':
                return 'file-video-box';
            case 'mp3':
            case 'wav':
            case 'flac':
                return 'file-music-box';
            case 'txt':
                return 'file-document-outline';
            default:
                return 'file-outline';
        }
    };

    return (
        <View style={{ maxWidth: '100%', gap: 6, width: '75%' }}>
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
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
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
                            fontWeight: '600',
                            lineHeight: 18,
                        }}
                        numberOfLines={1}
                    >
                        {message.fileName || message.text || 'Unknown File'}
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
function VideoPreviewBubble({ message }: { message: Message }) {
    const { colors } = useTheme();

    // Handle both videoPreview object (for link previews) and videoUri (for video attachments)
    const videoUrl = message.videoPreview?.url || message.videoUri;
    const thumbnailUri =
        message.videoPreview?.thumbnailUri || message.videoThumbnailUri;
    const title = message.videoPreview?.title || message.text || 'Video';
    const channel = message.videoPreview?.channel;

    if (!videoUrl) {
        return null; // Don't render if no URL
    }

    const handleOpen = () => Linking.openURL(videoUrl).catch(() => null);

    return (
        <View style={{ maxWidth: '78%', gap: 6 }}>
            {/* Thumbnail */}
            <TouchableOpacity
                onPress={handleOpen}
                style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: '#000',
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
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.35)',
                    }}
                >
                    <View
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                            fontWeight: '600',
                        }}
                    >
                        {channel}
                    </Text>
                )}
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: '600',
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
    const initials = (name ?? '?')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return (
        <View
            style={{
                width: AVATAR_SIZE,
                marginRight: 8,
                alignSelf: 'flex-end',
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
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: '700',
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
    /** Sender display name (used for initials fallback and group chat display) */
    senderName?: string;
    /** Callback khi nhấn giữ message */
    onLongPress?: (message: Message) => void;
}

const SENT_BG = '#00B14F';
const SENT_TEXT = '#FFFFFF';

export default function MessageBubble({
    message,
    showAvatar = false,
    avatarUri,
    senderName,
    onLongPress,
}: MessageBubbleProps) {
    const { colors } = useTheme();

    const receivedBg = colors.backgroundSecondary;
    const receivedText = colors.text;

    const renderContent = () => {
        const messageType = String(message.type || '').toUpperCase();
        switch (messageType) {
            case 'IMAGE':
                return <ImageBubble message={message} />;
            case 'FILE':
                return (
                    <FileBubble message={message} onLongPress={onLongPress} />
                );
            case 'LINK_PREVIEW':
                return <LinkPreviewBubble message={message} />;
            case 'VIDEO':
                // Video file attachment - show with thumbnail and play button
                return (
                    <VideoBubble message={message} onLongPress={onLongPress} />
                );
            case 'VIDEO_PREVIEW':
                // YouTube/video preview link - show with title and channel
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
        <Pressable
            onLongPress={() => onLongPress?.(message)}
            delayLongPress={500}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
            <View>
                {/* Show sender name for received group messages */}
                {!message.isMine && senderName && (
                    <Text
                        style={{
                            marginLeft: AVATAR_SIZE + 8,
                            marginBottom: 2,
                            fontSize: 12,
                            fontWeight: '600',
                            color: colors.textSecondary,
                        }}
                    >
                        {senderName}
                    </Text>
                )}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: message.isMine
                            ? 'flex-end'
                            : 'flex-start',
                        alignItems: 'flex-end',
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
                        <View
                            style={{
                                alignItems: 'flex-end',
                                marginTop: 2,
                                marginLeft: 4,
                            }}
                        >
                            <MessageStatus status={message.status} />
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}
