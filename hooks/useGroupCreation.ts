import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';

export const useGroupCreation = () => {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);

    const openModal = useCallback(() => {
        setModalVisible(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalVisible(false);
    }, []);

    const handleGroupCreated = useCallback(
        (conversationId: string) => {
            closeModal();
            // Navigate to the new group chat
            router.push({
                pathname: '/chat/[id]',
                params: { id: conversationId },
            });
        },
        [closeModal, router],
    );

    return {
        modalVisible,
        openModal,
        closeModal,
        handleGroupCreated,
    };
};
