import { io, Socket } from 'socket.io-client';
import { getSocketNamespaceUrl } from '@/config/api';

class PresenceSocketService {
    private socket: Socket | null = null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private connectionKey: string | null = null;

    connect(userId: string, platform: string = 'mobile', token?: string) {
        const nextConnectionKey = `${userId}:${platform}:${token || ''}`;

        if (this.socket?.connected && this.connectionKey === nextConnectionKey) {
            return this.socket;
        }

        if (this.socket) {
            this.disconnect();
        }

        console.log(
            '[PresenceSocket] Connecting with userId:',
            userId,
            'platform:',
            platform,
        );

        this.socket = io(getSocketNamespaceUrl('presence'), {
            query: { userId, platform },
            auth: token ? { token } : undefined,
            transports: ['websocket'],
            forceNew: false,
        });
        this.connectionKey = nextConnectionKey;

        this.socket.on('connect', () => {
            console.log('[PresenceSocket] Connected to presence server');
            this.socket?.emit('presence:get-online');

            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
            }

            this.heartbeatTimer = setInterval(() => {
                this.socket?.emit('presence:heartbeat', { userId });
            }, 15000);
        });

        this.socket.on('disconnect', () => {
            console.log('[PresenceSocket] Disconnected from presence server');
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        });

        this.socket.on('error', (error) => {
            console.error('[PresenceSocket] Socket error:', error);
        });

        return this.socket;
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.connectionKey = null;
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
}

export const presenceSocketService = new PresenceSocketService();
