import { Message } from '@/types/chat';
import { useCallback, useState } from 'react';

export default function useReplyMessage() {
    const [replyingMessage, setReplyingMessage] = useState<Message | null>(
        null,
    );

    const clearReply = useCallback(() => {
        setReplyingMessage(null);
    }, []);

    return {
        replyingMessage,
        setReplyingMessage,
        clearReply,
    };
}
