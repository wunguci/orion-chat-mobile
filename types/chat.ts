export type ChatItem = {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    isGroup: boolean;
    isMuted: boolean;
    isSentByMe: boolean;
    isRead: boolean; // only relevant when isSentByMe = true
    avatarUri?: string; // single avatar
    avatarUris?: string[]; // group avatars (up to 3)
};

// ─── Message types ──────────────────────────────────────────

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type MessageType =
    | 'TEXT'
    | 'IMAGE'
    | 'FILE'
    | 'VIDEO'
    | 'LINK_PREVIEW'
    | 'VIDEO_PREVIEW';

export interface AttachmentAsset {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
    width?: number;
    height?: number;
    duration?: number; // for video, in milliseconds
}

export interface LinkPreview {
    url: string;
    title: string;
    description?: string;
    thumbnailUri?: string;
    siteName?: string;
}

export interface VideoPreview {
    url: string;
    title: string;
    description?: string;
    thumbnailUri?: string;
    channel?: string;
}

export interface MessageReaction {
    userId: string;
    emoji: string;
    reactedAt: string;
}

export interface Message {
    id: string;
    chatId: string;
    senderId: string; // 'me' or user id
    senderName?: string; // sender display name (for group chats)
    senderAvatar?: string; // sender avatar URL (for group chats)
    type: MessageType;
    // text content (used for text, or caption for image/video)
    text?: string;
    // image
    imageUri?: string;
    imageCaption?: string;
    // video
    videoUri?: string;
    videoThumbnailUri?: string;
    videoDuration?: number;
    // file
    fileUri?: string;
    fileName?: string;
    fileMimeType?: string;
    fileSize?: number;
    // link preview
    linkPreview?: LinkPreview;
    // video preview
    videoPreview?: VideoPreview;
    // reactions (emoji)
    reactions?: MessageReaction[];
    // message status
    isRecalled?: boolean;
    timestamp: string; // display string e.g. "2:14 PM"
    status?: MessageStatus;
    isMine: boolean;
}
