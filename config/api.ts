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

const API_BASE_URL = normalizeUrl(
    envApiUrl ||
        (__DEV__
            ? `http://${resolveDevApiHost()}:3000`
            : 'http://localhost:3000'),
);

console.log('[API Config]', {
    __DEV__,
    API_BASE_URL,
    Platform: Platform.OS,
    envApiUrl,
});

export default API_BASE_URL;
