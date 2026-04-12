import { useTheme } from '@/hooks/useTheme';
import { Message } from '@/types/chat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Image,
    Linking,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const AVATAR_SIZE = 32;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_BUBBLE_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 320);
const MAX_MEDIA_WIDTH = Math.min(SCREEN_WIDTH * 0.56, 240);

const SENT_BG = '#00B14F';
const SENT_TEXT = '#FFFFFF';
const RECEIVED_BG = '#1F2125';
const RECEIVED_TEXT = '#F4F4F5';
const RECALL_BG = '#2A2A2A';
const RECALL_TEXT = '#9CA3AF';

function aggregateReactions(reactions?: Message['reactions']) {
    if (!Array.isArray(reactions) || reactions.length === 0) {
        return [] as { emoji: string; count: number }[];
    }

    const map = new Map<string, number>();
    reactions.forEach((item) => {
        const key = item.emoji;
        map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).map(([emoji, count]) => ({
        emoji,
        count,
    }));
}

function isRecalledMessage(message: Message): boolean {
    const normalized = (message.text || '').toLowerCase().trim();

    return (
        normalized === 'tin nhan da duoc thu hoi' ||
        normalized === 'tin nhắn đã được thu hồi'
    );
}

function formatFileSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return 'Khong ro kich thuoc';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatClockTime(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--:--';

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function resolveFileName(message: Message): string {
    if (message.fileName) {
        return message.fileName;
    }

    const fromUri = message.fileUri?.split('/').pop();
    if (fromUri) {
        return decodeURIComponent(fromUri);
    }

    return 'Tep dinh kem';
}

function MessageStatus({ status }: { status?: Message['status'] }) {
    if (!status) return null;

    if (status === 'sending') {
        return (
            <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color="rgba(255,255,255,0.55)"
            />
        );
    }

    if (status === 'delivered') {
        return (
            <MaterialCommunityIcons
                name="check-all"
                size={14}
                color="rgba(255,255,255,0.75)"
            />
        );
    }

    if (status === 'read') {
        return (
            <MaterialCommunityIcons
                name="check-all"
                size={14}
                color="#2D8CFF"
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

function TextBubble({ message }: { message: Message }) {
    const isMine = message.isMine;

    return (
        <View
            style={{
                backgroundColor: isMine ? SENT_BG : RECEIVED_BG,
                borderRadius: 18,
                borderBottomRightRadius: isMine ? 5 : 18,
                borderBottomLeftRadius: isMine ? 18 : 5,
                paddingHorizontal: 14,
                paddingVertical: 10,
                maxWidth: MAX_BUBBLE_WIDTH,
            }}
        >
            <Text
                style={{
                    color: isMine ? SENT_TEXT : RECEIVED_TEXT,
                    fontSize: 15,
                    lineHeight: 22,
                    flexShrink: 1,
                }}
                android_hyphenationFrequency="none"
                lineBreakStrategyIOS="none"
            >
                {message.text || ''}
            </Text>
        </View>
    );
}

function RecalledBubble() {
    return (
        <View
            style={{
                backgroundColor: RECALL_BG,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 9,
                maxWidth: MAX_BUBBLE_WIDTH,
                alignSelf: 'center',
            }}
        >
            <Text
                style={{
                    color: RECALL_TEXT,
                    fontSize: 13,
                    fontStyle: 'italic',
                    textAlign: 'center',
                }}
            >
                Tin nhan da duoc thu hoi
            </Text>
        </View>
    );
}

function ImageBubble({ message }: { message: Message }) {
    const { colors } = useTheme();

    return (
        <View
            style={{
                maxWidth: MAX_BUBBLE_WIDTH,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: colors.card,
            }}
        >
            <Image
                source={{ uri: message.imageUri }}
                style={{
                    width: MAX_MEDIA_WIDTH,
                    height: MAX_MEDIA_WIDTH * 0.75,
                }}
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
                        android_hyphenationFrequency="none"
                        lineBreakStrategyIOS="none"
                    >
                        {message.imageCaption}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

function FileBubble({ message }: { message: Message }) {
    const { colors } = useTheme();

    const handleDownload = () => {
        if (message.fileUri) {
            Linking.openURL(message.fileUri).catch(() => null);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleDownload}
            style={{
                maxWidth: MAX_BUBBLE_WIDTH,
                backgroundColor: message.isMine ? '#0B8A42' : '#24272D',
                borderRadius: 14,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
            }}
        >
            <MaterialCommunityIcons
                name="file-document-outline"
                size={30}
                color={message.isMine ? '#E5FFE7' : '#4EA1FF'}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                    style={{
                        color: message.isMine ? '#F6FFFA' : colors.text,
                        fontSize: 13,
                        fontWeight: '600',
                        lineHeight: 18,
                    }}
                    numberOfLines={1}
                >
                    {resolveFileName(message)}
                </Text>
                <Text
                    style={{
                        color: message.isMine
                            ? 'rgba(255,255,255,0.75)'
                            : colors.textSecondary,
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
                color={message.isMine ? '#E5FFE7' : '#4EA1FF'}
            />
        </TouchableOpacity>
    );
}

function LinkPreviewBubble({ message }: { message: Message }) {
    const { colors } = useTheme();
    const lp = message.linkPreview;

    if (!lp?.url) {
        return <TextBubble message={message} />;
    }

    const handleOpen = () => Linking.openURL(lp.url).catch(() => null);

    return (
        <View style={{ maxWidth: MAX_BUBBLE_WIDTH, gap: 6 }}>
            {message.text ? (
                <View
                    style={{
                        backgroundColor: message.isMine ? '#0B8A42' : '#24272D',
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                    }}
                >
                    <Text
                        style={{
                            color: message.isMine ? '#F6FFFA' : colors.text,
                            fontSize: 14,
                        }}
                        android_hyphenationFrequency="none"
                        lineBreakStrategyIOS="none"
                    >
                        {message.text}
                    </Text>
                </View>
            ) : null}
            <TouchableOpacity
                onPress={handleOpen}
                style={{
                    backgroundColor: message.isMine ? '#0B8A42' : '#24272D',
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
                <View style={{ flex: 1, padding: 10, minWidth: 0 }}>
                    <Text
                        style={{
                            color: message.isMine ? '#F6FFFA' : colors.text,
                            fontSize: 13,
                            fontWeight: '600',
                            lineHeight: 18,
                        }}
                        numberOfLines={2}
                    >
                        {lp.title}
                    </Text>
                    {lp.siteName ? (
                        <Text
                            style={{
                                color: message.isMine
                                    ? 'rgba(255,255,255,0.75)'
                                    : colors.textSecondary,
                                fontSize: 11,
                                marginTop: 2,
                            }}
                        >
                            {lp.siteName}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        </View>
    );
}

function VideoPreviewBubble({ message }: { message: Message }) {
    const { colors } = useTheme();
    const vp = message.videoPreview;
    const resolvedUrl = vp?.url || message.videoUri || message.fileUri;
    const resolvedThumbnail =
        vp?.thumbnailUri || message.videoThumbnailUri || message.imageUri;
    const resolvedTitle =
        vp?.title || message.fileName || message.text || 'Video';

    const handleOpen = () => {
        if (!resolvedUrl) return;
        Linking.openURL(resolvedUrl).catch(() => null);
    };

    return (
        <View style={{ maxWidth: MAX_BUBBLE_WIDTH, gap: 6 }}>
            <TouchableOpacity
                onPress={handleOpen}
                disabled={!resolvedUrl}
                style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: '#000',
                }}
            >
                {resolvedThumbnail && (
                    <Image
                        source={{ uri: resolvedThumbnail }}
                        style={{
                            width: MAX_MEDIA_WIDTH,
                            height: MAX_MEDIA_WIDTH * 0.56,
                        }}
                        resizeMode="cover"
                    />
                )}
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

            <View
                style={{
                    backgroundColor: message.isMine ? '#0B8A42' : '#24272D',
                    borderRadius: 14,
                    padding: 10,
                }}
            >
                <Text
                    style={{
                        color: message.isMine ? '#F6FFFA' : colors.text,
                        fontSize: 14,
                        fontWeight: '600',
                    }}
                    numberOfLines={2}
                >
                    {resolvedTitle}
                </Text>
            </View>
        </View>
    );
}

interface MessageBubbleProps {
    message: Message;
    showAvatar?: boolean;
    avatarUri?: string;
    senderName?: string;
}

export default function MessageBubble({
    message,
    showAvatar = false,
    avatarUri,
    senderName,
}: MessageBubbleProps) {
    const { colors } = useTheme();
    const recalled = isRecalledMessage(message);
    const reactionStats = aggregateReactions(message.reactions);

    const renderContent = () => {
        if (recalled) {
            return <RecalledBubble />;
        }

        switch (message.type) {
            case 'IMAGE':
                return <ImageBubble message={message} />;
            case 'FILE':
                return <FileBubble message={message} />;
            case 'LINK_PREVIEW':
                return <LinkPreviewBubble message={message} />;
            case 'VIDEO_PREVIEW':
                return <VideoPreviewBubble message={message} />;
            default:
                return <TextBubble message={message} />;
        }
    };

    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: message.isMine ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                paddingHorizontal: 12,
                marginBottom: 3,
            }}
        >
            {!message.isMine && (
                <SenderAvatar
                    avatarUri={avatarUri}
                    name={senderName}
                    visible={showAvatar && !recalled}
                />
            )}

            <View style={{ maxWidth: MAX_BUBBLE_WIDTH + 20 }}>
                {!recalled && message.replyToMessageText ? (
                    <View
                        style={{
                            maxWidth: MAX_BUBBLE_WIDTH,
                            alignSelf: message.isMine
                                ? 'flex-end'
                                : 'flex-start',
                            marginBottom: 4,
                            borderRadius: 12,
                            borderLeftWidth: 3,
                            borderLeftColor: message.isMine
                                ? '#0B8A42'
                                : colors.primary,
                            backgroundColor: '#23262C',
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                        }}
                    >
                        <Text
                            style={{
                                color: '#9CA3AF',
                                fontSize: 12,
                                fontWeight: '600',
                                marginBottom: 2,
                            }}
                        >
                            Tra loi
                        </Text>
                        <Text
                            style={{
                                color: '#C0C4CC',
                                fontSize: 12,
                            }}
                            numberOfLines={2}
                        >
                            {message.replyToMessageText}
                        </Text>
                    </View>
                ) : null}

                {renderContent()}

                {reactionStats.length > 0 && !recalled ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 6,
                            marginTop: -8,
                            marginBottom: 2,
                            alignSelf: message.isMine
                                ? 'flex-end'
                                : 'flex-start',
                            maxWidth: MAX_BUBBLE_WIDTH,
                        }}
                    >
                        {reactionStats.map((reaction) => (
                            <View
                                key={`${reaction.emoji}_${reaction.count}`}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                    backgroundColor: '#1F232A',
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                }}
                            >
                                <Text style={{ fontSize: 12 }}>
                                    {reaction.emoji}
                                </Text>
                                <Text
                                    style={{
                                        color: colors.textSecondary,
                                        fontSize: 11,
                                    }}
                                >
                                    {reaction.count}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: message.isMine ? 'flex-end' : 'flex-start',
                        marginTop: 2,
                        gap: 4,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            color: '#9CA3AF',
                        }}
                    >
                        {formatClockTime(message.timestamp)}
                    </Text>
                    {message.isMine ? (
                        <MessageStatus status={message.status} />
                    ) : null}
                </View>
            </View>
        </View>
    );
}
