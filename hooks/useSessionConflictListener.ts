import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useSessionConflictListener = () => {
    const { socket, isConnected } = useSocket();
    const { logout, state } = useAuth();
    const handledRef = useRef<boolean>(false);
    const loginTimeRef = useRef<number>(0); // Track listener setup time to avoid self-conflict
    const listenerAttachedRef = useRef<boolean>(false); // Track if listener is attached

    useEffect(() => {
        console.log(
            '[useSessionConflictListener] Effect triggered - socket:',
            !!socket,
            'isConnected:',
            isConnected,
            'authenticated:',
            state.isAuthenticated,
            'listenerAttached:',
            listenerAttachedRef.current,
        );

        if (!socket || !isConnected || !state.isAuthenticated) {
            console.log(
                '[useSessionConflictListener] No socket/connected/authenticated, returning',
            );
            if (listenerAttachedRef.current && socket) {
                // Clean up if we're removing the listener
                console.log(
                    '[useSessionConflictListener] Cleaning up listener',
                );
                listenerAttachedRef.current = false;
            }
            return;
        }

        if (listenerAttachedRef.current) {
            console.log(
                '[useSessionConflictListener] Listener already attached, skipping re-setup',
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

            // IMPORTANT: Handle conflicts where MOBILE is the old platform being replaced
            // This includes:
            // 1. Same-platform: oldPlatform='mobile', newPlatform='mobile' (another mobile logged in)
            // 2. Cross-platform: oldPlatform='mobile', newPlatform='web' (web login, mobile session old)
            if (data.oldPlatform !== 'mobile') {
                console.log(
                    '[useSessionConflictListener] Ignoring - old platform is not mobile:',
                    data.oldPlatform,
                );
                return;
            }

            // IMPORTANT: Ignore conflict event if it happens within 1 second of listener setup
            // This prevents the new socket from receiving its own session conflict event
            // (can happen when server broadcasts to platform room before socket fully joins)
            const timeSinceListenerSetup = Date.now() - loginTimeRef.current;
            console.log(
                `[useSessionConflictListener] Time since listener setup: ${timeSinceListenerSetup}ms`,
            );
            if (timeSinceListenerSetup < 1000) {
                console.log(
                    `[useSessionConflictListener] Ignoring conflict too close to listener setup (${timeSinceListenerSetup}ms). Likely self-conflict.`,
                );
                return;
            }

            if (handledRef.current) {
                console.log(
                    '[useSessionConflictListener] Already handled conflict, ignoring duplicate',
                );
                return;
            }

            handledRef.current = true;

            // Show alert FIRST to inform user immediately
            Alert.alert(
                'Phiên Đăng Nhập Bị Chiếm Dụng',
                data.message ||
                    'Tài khoản của bạn được đăng nhập từ thiết bị mobile khác. Phiên hiện tại sẽ bị đóng.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            console.log(
                                '[useSessionConflictListener] User dismissed alert, performing logout...',
                            );
                            // Logout after user dismisses alert
                            try {
                                await logout();
                                console.log(
                                    '[useSessionConflictListener] Auto-logout successful after dismiss',
                                );
                            } catch (error) {
                                console.error(
                                    '[useSessionConflictListener] Error during auto-logout:',
                                    error,
                                );
                            }
                        },
                    },
                ],
                { cancelable: false },
            );
        };

        // Record listener setup time (acts as login time for this session)
        loginTimeRef.current = Date.now();
        listenerAttachedRef.current = true;

        socket.on('session:conflict', handleSessionConflict);
        console.log(
            '[useSessionConflictListener] Listener attached to session:conflict event',
        );

        return () => {
            console.log(
                '[useSessionConflictListener] Removing session:conflict listener',
            );
            socket.off('session:conflict', handleSessionConflict);
            listenerAttachedRef.current = false;
        };
    }, [socket, isConnected, logout, state.isAuthenticated]);
};
