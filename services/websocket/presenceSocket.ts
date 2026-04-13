import { io, Socket } from 'socket.io-client';
import API_BASE_URL from '@/config/api';

const SOCKET_BASE_URL = (process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL)
    .replace(/\/$/, '')
    .replace(/\/presence$/, '');

const PRESENCE_URL = `${SOCKET_BASE_URL}/presence`;

class PresenceSocketService {
    private socket: Socket | null = null;

    connect(userId: string, platform: string = 'mobile') {
        if (this.socket?.connected) {
            return this.socket;
        }

        console.log(
            '[PresenceSocket] Connecting with userId:',
            userId,
            'platform:',
            platform,
        );

        this.socket = io(PRESENCE_URL, {
            query: { userId, platform },
            transports: ['websocket'],
            forceNew: false,
        });

        this.socket.on('connect', () => {
            console.log('[PresenceSocket] Connected to presence server');
        });

        this.socket.on('disconnect', () => {
            console.log('[PresenceSocket] Disconnected from presence server');
        });

        this.socket.on('error', (error) => {
            console.error('[PresenceSocket] Socket error:', error);
        });

        return this.socket;
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}

export const presenceSocketService = new PresenceSocketService();
