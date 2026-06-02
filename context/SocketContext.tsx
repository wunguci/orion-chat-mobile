import React, {
    createContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from 'react';
import { Socket } from 'socket.io-client';
import { presenceSocketService } from '@/services/websocket/presenceSocket';
import { useAuth } from '@/hooks/useAuth';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { state } = useAuth();
    const userId = state.user?.userId;
    const token = state.token || undefined;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const lastTokenRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (userId && token) {
            console.log(
                '[SocketProvider] User authenticated, connecting to presence socket',
            );
            if (lastTokenRef.current && lastTokenRef.current !== token) {
                presenceSocketService.disconnect();
            }

            const connectedSocket = presenceSocketService.connect(
                userId,
                'mobile',
                token,
            );
            setSocket(connectedSocket);
            setIsConnected(connectedSocket.connected);
            lastTokenRef.current = token;

            const handleConnect = () => {
                console.log('[SocketProvider] Socket connected');
                setIsConnected(true);
            };

            const handleDisconnect = () => {
                console.log('[SocketProvider] Socket disconnected');
                setIsConnected(false);
            };

            connectedSocket.on('connect', handleConnect);
            connectedSocket.on('disconnect', handleDisconnect);

            return () => {
                connectedSocket.off('connect', handleConnect);
                connectedSocket.off('disconnect', handleDisconnect);
            };
        } else {
            console.log(
                '[SocketProvider] User not authenticated, disconnecting socket',
            );
            presenceSocketService.disconnect();
            setSocket(null);
            setIsConnected(false);
            lastTokenRef.current = undefined;
        }
    }, [userId, token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
