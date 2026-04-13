import React, { createContext, useEffect, useState, ReactNode } from 'react';
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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (userId) {
            console.log(
                '[SocketProvider] User authenticated, connecting to presence socket',
            );
            const connectedSocket = presenceSocketService.connect(
                userId,
                'mobile',
            );
            setSocket(connectedSocket);

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
        }
    }, [userId]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
