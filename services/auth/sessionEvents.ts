type SessionExpiredPayload = {
    message?: string;
};

type SessionExpiredListener = (payload: SessionExpiredPayload) => void;

const sessionExpiredListeners = new Set<SessionExpiredListener>();
let lastNotifiedAt = 0;

export class SessionExpiredError extends Error {
    isSessionExpired = true;

    constructor(message: string) {
        super(message);
        this.name = 'SessionExpiredError';
    }
}

export const notifySessionExpired = (payload: SessionExpiredPayload = {}) => {
    const now = Date.now();
    if (now - lastNotifiedAt < 3000) return;
    lastNotifiedAt = now;

    sessionExpiredListeners.forEach((listener) => listener(payload));
};

export const subscribeSessionExpired = (listener: SessionExpiredListener) => {
    sessionExpiredListeners.add(listener);
    return () => {
        sessionExpiredListeners.delete(listener);
    };
};

export const isSessionExpiredError = (error: unknown) => {
    if (error instanceof SessionExpiredError) return true;
    if (!(error instanceof Error)) return false;

    const lowerMessage = error.message.toLowerCase();
    return (
        lowerMessage.includes('phiên làm việc') ||
        lowerMessage.includes('phien lam viec') ||
        lowerMessage.includes('unauthorized') ||
        (lowerMessage.includes('statuscode') && lowerMessage.includes('401')) ||
        lowerMessage.includes('http 401')
    );
};
