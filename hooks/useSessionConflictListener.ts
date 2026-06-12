import { Alert } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useSessionConflictListener = () => {
    const { socket, isConnected } = useSocket();
    const { logout, state } = useAuth();
    const handledRef = useRef(false);

    useEffect(() => {
        if (state.isAuthenticated) {
            handledRef.current = false;
        }
    }, [state.isAuthenticated, state.token]);

    useEffect(() => {
        if (!socket || !isConnected || !state.isAuthenticated) return;

        const handleSessionConflict = (data: {
            message: string;
            oldPlatform: string;
            newPlatform: string;
            timestamp: number;
        }) => {
            // Chỉ xử lý khi phiên cũ là mobile (thiết bị này bị chiếm)
            // và phiên mới cũng là mobile (mobile khác đăng nhập)
            if (data.oldPlatform !== 'mobile' || data.newPlatform !== 'mobile')
                return;

            if (handledRef.current) return;
            handledRef.current = true;

            Alert.alert(
                'Phiên đăng nhập bị thay thế',
                'Tài khoản của bạn đã được đăng nhập trên thiết bị khác. Bạn cần đăng nhập lại.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            void logout({ skipApi: true }).catch((error) => {
                                console.log(
                                    '[SessionConflict] Local logout failed:',
                                    error,
                                );
                            });
                        },
                    },
                ],
                { cancelable: false },
            );
        };

        socket.on('session:conflict', handleSessionConflict);

        return () => {
            socket.off('session:conflict', handleSessionConflict);
        };
    }, [socket, isConnected, state.isAuthenticated, logout]);
};
