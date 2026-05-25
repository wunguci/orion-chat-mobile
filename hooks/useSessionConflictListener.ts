import { Alert } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useSessionConflictListener = () => {
    const { socket, isConnected } = useSocket();
    const { logout, state } = useAuth();
    const handledRef = useRef(false);
    const loginTimeRef = useRef(0);

    useEffect(() => {
        if (!socket || !isConnected || !state.isAuthenticated) return;

        const handleSessionConflict = (data: {
            message: string;
            oldPlatform: string;
            newPlatform: string;
            timestamp: number;
        }) => {
            if (data.oldPlatform !== 'mobile') return;

            const timeSinceSetup = Date.now() - loginTimeRef.current;
            if (timeSinceSetup < 1000) return;

            if (handledRef.current) return;
            handledRef.current = true;

            Alert.alert(
                'Phiên đăng nhập bị thay thế',
                'Tài khoản của bạn đã được đăng nhập trên thiết bị khác. Bạn cần đăng nhập lại.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            void logout();
                        },
                    },
                ],
                { cancelable: false },
            );
        };

        loginTimeRef.current = Date.now();
        socket.on('session:conflict', handleSessionConflict);

        return () => {
            socket.off('session:conflict', handleSessionConflict);
        };
    }, [socket, isConnected, state.isAuthenticated, logout]);
};
