import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useSessionConflictListener = () => {
    const { socket, isConnected } = useSocket();
    const { logout, state } = useAuth();
    const handledRef = useRef<boolean>(false);

    // Reset handler when user logs out (for next session)
    useEffect(() => {
        if (!state.isAuthenticated) {
            console.log(
                '[useSessionConflictListener] User logged out, resetting handler',
            );
            handledRef.current = false;
        }
    }, [state.isAuthenticated]);

    useEffect(() => {
        console.log(
            '[useSessionConflictListener] Effect triggered - socket:',
            !!socket,
            'isConnected:',
            isConnected,
        );

        if (!socket) {
            console.log('[useSessionConflictListener] No socket, returning');
            return;
        }

        console.log(
            '[useSessionConflictListener] Setting up listener for session:conflict',
        );

        const handleSessionConflict = (data: {
            message: string;
            oldPlatform: string;
            newPlatform: string;
            timestamp: number;
        }) => {
            console.log(
                '[useSessionConflictListener] ✅ Received session conflict event:',
                data,
            );

            if (handledRef.current) {
                console.log(
                    '[useSessionConflictListener] Already handled conflict, ignoring',
                );
                return;
            }

            handledRef.current = true;

            Alert.alert(
                'Session Conflict',
                data.message ||
                    'Your session has been terminated on another device.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            console.log(
                                '[useSessionConflictListener] User confirmed, logging out',
                            );
                            try {
                                await logout();
                            } catch (error) {
                                console.error(
                                    '[useSessionConflictListener] Error during logout:',
                                    error,
                                );
                            }
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
    }, [socket, isConnected, logout]);
};
