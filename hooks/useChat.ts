import { AttachmentAsset, Message, MessageType } from '@/types/chat';
import { useCallback, useState } from 'react';

// ── Mock generator ──────────────────────────────────────────
function buildMockMessages(chatId: string): Message[] {
    return [
        {
            id: '1',
            chatId,
            senderId: 'other',
            type: 'text',
            text: 'Who was that philosopher you shared with me recently?',
            timestamp: '2:14 PM',
            isMine: false,
        },
        {
            id: '2',
            chatId,
            senderId: 'me',
            type: 'text',
            text: 'Roland Barthes',
            timestamp: '2:16 PM',
            status: 'read',
            isMine: true,
        },
        {
            id: '3',
            chatId,
            senderId: 'other',
            type: 'text',
            text: "That's him!",
            timestamp: '2:18 PM',
            isMine: false,
        },
        {
            id: '4',
            chatId,
            senderId: 'other',
            type: 'text',
            text: 'What was his vision statement?',
            timestamp: '2:18 PM',
            isMine: false,
        },
        {
            id: '5',
            chatId,
            senderId: 'me',
            type: 'text',
            text: '"Ultimately in order to see a photograph well, it is best tolook away or close your eyes."',
            timestamp: '2:20 PM',
            status: 'read',
            isMine: true,
        },
        {
            id: '6',
            chatId,
            senderId: 'me',
            type: 'image',
            imageUri:
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
            imageCaption:
                'Aerial photograph from the Helsinki urban environment division.',
            timestamp: '2:20 PM',
            status: 'read',
            isMine: true,
        },
        {
            id: '7',
            chatId,
            senderId: 'other',
            type: 'link_preview',
            text: 'Check this https://dribbble.com',
            linkPreview: {
                url: 'https://dribbble.com',
                title: 'Aerial photograph from the Helsinki urban environment division',
                siteName: 'dribbble.com',
                thumbnailUri:
                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120',
            },
            timestamp: '2:22 PM',
            isMine: false,
        },
        {
            id: '8',
            chatId,
            senderId: 'other',
            type: 'video_preview',
            text: 'I wish I could be there\nhttps://www.youtube.com/watch?v=G3hPH_bc0Ww',
            videoPreview: {
                url: 'https://www.youtube.com/watch?v=G3hPH_bc0Ww',
                title: 'The First 10,000 Days on Mars (Tim...',
                description: 'The story begins in 2024 when Elon ...',
                channel: 'Youtube',
                thumbnailUri:
                    'https://img.youtube.com/vi/G3hPH_bc0Ww/hqdefault.jpg',
            },
            timestamp: '2:24 PM',
            isMine: false,
        },
    ];
}

// ── Hook ────────────────────────────────────────────────────
export function useChat(chatId: string) {
    const [messages, setMessages] = useState<Message[]>(() =>
        buildMockMessages(chatId),
    );
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const sendMessage = useCallback(
        (text: string) => {
            if (!text.trim()) return;
            const newMsg: Message = {
                id: Date.now().toString(),
                chatId,
                senderId: 'me',
                type: 'text',
                text: text.trim(),
                timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                status: 'sending',
                isMine: true,
            };
            setMessages((prev) => [...prev, newMsg]);
            setInputText('');

            // Simulate delivery
            setIsSending(true);
            setTimeout(() => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === newMsg.id ? { ...m, status: 'sent' } : m,
                    ),
                );
                setIsSending(false);
            }, 800);
        },
        [chatId],
    );

    const sendAttachment = useCallback(
        (asset: AttachmentAsset) => {
            const mimeType = asset.mimeType ?? '';
            let type: MessageType = 'file';
            if (mimeType.startsWith('image/')) type = 'image';
            else if (mimeType.startsWith('video/')) type = 'video';

            const baseMsg: Omit<
                Message,
                | 'imageUri'
                | 'videoUri'
                | 'fileUri'
                | 'fileName'
                | 'fileMimeType'
                | 'fileSize'
            > = {
                id: Date.now().toString(),
                chatId,
                senderId: 'me',
                type,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                status: 'sending',
                isMine: true,
            };

            const newMsg: Message =
                type === 'image'
                    ? { ...baseMsg, imageUri: asset.uri }
                    : type === 'video'
                      ? {
                            ...baseMsg,
                            videoUri: asset.uri,
                            videoDuration: asset.duration,
                        }
                      : {
                            ...baseMsg,
                            fileUri: asset.uri,
                            fileName: asset.name,
                            fileMimeType: asset.mimeType,
                            fileSize: asset.size,
                        };

            setMessages((prev) => [...prev, newMsg]);

            setTimeout(() => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === newMsg.id ? { ...m, status: 'sent' } : m,
                    ),
                );
            }, 800);
        },
        [chatId],
    );

    return {
        messages,
        inputText,
        setInputText,
        sendMessage,
        sendAttachment,
        isSending,
    };
}
