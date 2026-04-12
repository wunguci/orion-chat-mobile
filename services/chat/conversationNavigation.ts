import { chatApi } from '@/services/api/chat';

type RouterLike = {
    push: (params: {
        pathname: '/chat/[id]';
        params: {
            id: string;
            name?: string;
            avatarUri?: string;
        };
    }) => void;
};

type OpenOrCreateConversationParams = {
    router: RouterLike;
    // Neu da co conversation thi mo truc tiep.
    conversationId?: string;
    // Neu chua co thi tao private conversation bang targetUserId.
    targetUserId?: string;
    name?: string;
    avatarUri?: string;
};

export async function openOrCreateConversation({
    router,
    conversationId,
    targetUserId,
    name,
    avatarUri,
}: OpenOrCreateConversationParams): Promise<string> {
    let resolvedConversationId = conversationId;

    if (!resolvedConversationId) {
        if (!targetUserId) {
            throw new Error('Missing targetUserId to create conversation');
        }

        const created = await chatApi.createConversation({
            receiverId: targetUserId,
        });

        resolvedConversationId = created.conversationId;
    }

    if (!resolvedConversationId) {
        throw new Error('Khong nhan duoc conversationId');
    }

    router.push({
        pathname: '/chat/[id]',
        params: {
            id: resolvedConversationId,
            name,
            avatarUri,
        },
    });

    return resolvedConversationId;
}
