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

export type MessageType = 'text' | 'image' | 'link_preview' | 'video_preview';

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

export interface Message {
    id: string;
    chatId: string;
    senderId: string; // 'me' or user id
    type: MessageType;
    // text content (used for text, or caption for image/video)
    text?: string;
    // image
    imageUri?: string;
    imageCaption?: string;
    // link preview
    linkPreview?: LinkPreview;
    // video preview
    videoPreview?: VideoPreview;
    timestamp: string; // display string e.g. "2:14 PM"
    status?: MessageStatus;
    isMine: boolean;
}
