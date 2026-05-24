import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ExpoHostConfig = {
    expoConfig?: { hostUri?: string | null };
    expoGoConfig?: { debuggerHost?: string | null };
};

const extractHost = (hostUri?: string | null): string | null => {
    if (!hostUri) return null;
    const [host] = hostUri.split(':');
    return host || null;
};

const resolveDevApiHost = (): string => {
    const constants = Constants as unknown as ExpoHostConfig;
    const hostFromExpo =
        extractHost(constants.expoConfig?.hostUri) ||
        extractHost(constants.expoGoConfig?.debuggerHost);

    if (hostFromExpo) {
        return hostFromExpo;
    }

    // Android emulator không truy cập được localhost của máy dev.
    if (Platform.OS === 'android') {
        return '172.16.0.173';
    }

    return 'localhost';
};

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const DEFAULT_LOCAL_API_HOST =
    Platform.OS === 'android' ? resolveDevApiHost() : 'localhost';

// Convert HTTPS to HTTP for development/mobile (SSL certificate issues)
const normalizeUrl = (url: string): string => {
    let normalized = url.replace(/\/+$/, '');

    // If duckdns (development), force HTTP to avoid SSL issues on mobile
    if (normalized.includes('duckdns.org')) {
        normalized = normalized.replace('https://', 'http://');
        console.log(
            '[API Config] Using HTTP for duckdns (avoiding SSL on mobile)',
        );
    }

    return normalized;
};

export const API_BASE_URL = normalizeUrl(
    envApiUrl ||
        `http://${DEFAULT_LOCAL_API_HOST}:3000`,
);

console.log('[API Config]', {
    __DEV__,
    API_BASE_URL,
    Platform: Platform.OS,
    envApiUrl,
});

export const API_REQUEST_TIMEOUT_MS = 15000;

export async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = API_REQUEST_TIMEOUT_MS,
): Promise<Response> {
    if (init.signal) {
        return fetch(input, init);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(
                'Khong the ket noi toi server sau 15 giay. Kiem tra API URL va ket noi mang.',
            );
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export default API_BASE_URL;
