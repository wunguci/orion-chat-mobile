import Constants from "expo-constants";
import { Platform } from "react-native";

type ExpoHostConfig = {
  expoConfig?: { hostUri?: string | null };
  expoGoConfig?: { debuggerHost?: string | null };
};

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

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

  // Android emulator không truy cập được localhost của máy dev.
  if (Platform.OS === "android") {
    return "10.0.2.2";
  }

  return "localhost";
};

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const API_BASE_URL = normalizeBaseUrl(
  envApiUrl ||
    (__DEV__ ? `http://${resolveDevApiHost()}:3000` : "http://localhost:3000"),
);

export default API_BASE_URL;
