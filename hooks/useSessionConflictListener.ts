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
            'authenticated:',
            state.isAuthenticated,
        );

        if (!socket || !state.isAuthenticated) {
            console.log(
                '[useSessionConflictListener] No socket or not authenticated, returning',
            );
            return;
        }

        console.log(
            '[useSessionConflictListener] Setting up listener for session:conflict event',
        );

        const handleSessionConflict = (data: {
            message: string;
            oldPlatform: string;
            newPlatform: string;
            timestamp: number;
        }) => {
            console.log(
                '[useSessionConflictListener] RECEIVED SESSION CONFLICT EVENT:',
                JSON.stringify(data, null, 2),
            );

            if (handledRef.current) {
                console.log(
                    '[useSessionConflictListener] Already handled conflict, ignoring duplicate',
                );
                return;
            }

            handledRef.current = true;

            // Auto-logout immediately without waiting for user confirmation
            const performLogout = async () => {
                console.log(
                    '[useSessionConflictListener] AUTO-LOGOUT triggered immediately...',
                );
                try {
                    await logout();
                    console.log(
                        '[useSessionConflictListener] Auto-logout successful',
                    );
                } catch (error) {
                    console.error(
                        '[useSessionConflictListener] Error during auto-logout:',
                        error,
                    );
                }
            };

            // Start logout immediately
            performLogout();

            // Show alert to inform user (after logout starts)
            setTimeout(() => {
                Alert.alert(
                    'Session Conflict',
                    data.message ||
                        'Your session has been terminated on another device. You have been logged out.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                console.log(
                                    '[useSessionConflictListener] User dismissed alert',
                                );
                            },
                        },
                    ],
                    { cancelable: false },
                );
            }, 300);
        };

        socket.on('session:conflict', handleSessionConflict);
        console.log(
            '[useSessionConflictListener] Listener attached to session:conflict event',
        );

        return () => {
            console.log(
                '[useSessionConflictListener] Removing session:conflict listener',
            );
            socket.off('session:conflict', handleSessionConflict);
        };
    }, [socket, isConnected, logout, state.isAuthenticated]);
};
