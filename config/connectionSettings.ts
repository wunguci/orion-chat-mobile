import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

export type TurnProvider = "default" | "metered" | "coturn";

export type MobileConnectionSettings = {
  apiUrl?: string;
  socketUrl?: string;
  turnProvider?: TurnProvider;
  coturnHost?: string;
};

type ExpoHostConfig = {
  expoConfig?: { hostUri?: string | null };
  expoGoConfig?: { debuggerHost?: string | null };
};

type IceRuntimeOptions = {
  iceUrls?: string;
  iceUsername?: string;
  iceCredential?: string;
  forceRelay: boolean;
  allowPublicStun: boolean;
};

const STORAGE_KEY = "orion_mobile_connection_settings";

const extractHost = (hostUri?: string | null): string | null => {
  if (!hostUri) return null;
  const [host] = hostUri.split(":");
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

  if (Platform.OS === "android") {
    return "172.16.0.173";
  }

  return "localhost";
};

export const normalizeUrl = (url: string): string => {
  let normalized = url.trim().replace(/\/+$/, "");

  if (normalized.includes("duckdns.org")) {
    normalized = normalized.replace("https://", "http://");
    console.log("[API Config] Using HTTP for duckdns (avoiding SSL on mobile)");
  }

  return normalized;
};

const DEFAULT_LOCAL_API_HOST =
  Platform.OS === "android" ? resolveDevApiHost() : "localhost";

export const DEFAULT_API_BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
    `http://${DEFAULT_LOCAL_API_HOST}:3000`,
);

export const DEFAULT_SOCKET_BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || DEFAULT_API_BASE_URL,
);

let currentSettings: MobileConnectionSettings = {};

export let API_BASE_URL = DEFAULT_API_BASE_URL;
export let SOCKET_BASE_URL = DEFAULT_SOCKET_BASE_URL;

const sanitizeSettings = (
  settings: MobileConnectionSettings,
): MobileConnectionSettings => ({
  apiUrl: settings.apiUrl?.trim() || undefined,
  socketUrl: settings.socketUrl?.trim() || undefined,
  turnProvider: settings.turnProvider || "default",
  coturnHost: settings.coturnHost?.trim() || undefined,
});

export const applyConnectionSettings = (
  settings: MobileConnectionSettings,
): MobileConnectionSettings => {
  currentSettings = sanitizeSettings(settings);
  API_BASE_URL = normalizeUrl(currentSettings.apiUrl || DEFAULT_API_BASE_URL);
  SOCKET_BASE_URL = normalizeUrl(
    currentSettings.socketUrl || DEFAULT_SOCKET_BASE_URL || API_BASE_URL,
  );

  console.log("[Connection Settings]", {
    API_BASE_URL,
    SOCKET_BASE_URL,
    turnProvider: currentSettings.turnProvider || "default",
    coturnHost: currentSettings.coturnHost,
  });

  return currentSettings;
};

export const loadConnectionSettings =
  async (): Promise<MobileConnectionSettings> => {
    try {
      const rawSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (!rawSettings) {
        return applyConnectionSettings({});
      }

      const parsed = JSON.parse(rawSettings) as MobileConnectionSettings;
      return applyConnectionSettings(parsed);
    } catch (error) {
      console.warn("[Connection Settings] Failed to load settings:", error);
      return applyConnectionSettings({});
    }
  };

export const saveConnectionSettings = async (
  settings: MobileConnectionSettings,
): Promise<MobileConnectionSettings> => {
  const sanitized = applyConnectionSettings(settings);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
};

export const resetConnectionSettings =
  async (): Promise<MobileConnectionSettings> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return applyConnectionSettings({});
  };

export const getConnectionSettingsSnapshot = (): MobileConnectionSettings => ({
  ...currentSettings,
});

export const getSocketNamespaceUrl = (namespace: string): string => {
  const cleanNamespace = namespace.replace(/^\/+/, "").replace(/\/+$/, "");
  const base = SOCKET_BASE_URL.replace(/\/+$/, "").replace(
    new RegExp(`/${cleanNamespace}$`),
    "",
  );

  return `${base}/${cleanNamespace}`;
};

export const getIceRuntimeOptions = (): IceRuntimeOptions => {
  const provider = currentSettings.turnProvider || "default";
  const envIceUrls =
    process.env.EXPO_PUBLIC_ICE_URLS || process.env.EXPO_PUBLIC_TURN_URLS;
  const envIceUsername =
    process.env.EXPO_PUBLIC_ICE_USERNAME ||
    process.env.EXPO_PUBLIC_TURN_USERNAME;
  const envIceCredential =
    process.env.EXPO_PUBLIC_ICE_CREDENTIAL ||
    process.env.EXPO_PUBLIC_TURN_CREDENTIAL;
  const envForceRelay =
    process.env.EXPO_PUBLIC_FORCE_TURN_RELAY === "true";
  const envAllowPublicStun =
    process.env.EXPO_PUBLIC_ALLOW_PUBLIC_STUN !== "false";

  if (provider === "coturn" && currentSettings.coturnHost) {
    const host = currentSettings.coturnHost;
    const port = process.env.EXPO_PUBLIC_TURN_PORT || "3478";
    const iceUrls = [
      `stun:${host}:${port}`,
      `turn:${host}:${port}?transport=udp`,
      `turn:${host}:${port}?transport=tcp`,
    ].join(",");

    return {
      iceUrls,
      iceUsername: envIceUsername || "orion",
      iceCredential: envIceCredential || "orion-chat",
      forceRelay: true,
      allowPublicStun: false,
    };
  }

  return {
    iceUrls: envIceUrls,
    iceUsername: envIceUsername,
    iceCredential: envIceCredential,
    forceRelay: envForceRelay,
    allowPublicStun: envAllowPublicStun,
  };
};

applyConnectionSettings({});
