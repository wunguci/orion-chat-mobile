import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const resolveBaseUrl = (baseUrl: string) => {
  if (Platform.OS === "android" && baseUrl.includes("localhost")) {
    return baseUrl.replace("localhost", "10.0.2.2");
  }
  return baseUrl;
};

export const API_BASE_URL = resolveBaseUrl(
  (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
);

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
};

const getAuthToken = async () => {
  const tokenCandidates = [
    await AsyncStorage.getItem("auth_token"),
    await AsyncStorage.getItem("token"),
    await AsyncStorage.getItem("accessToken"),
  ];

  return tokenCandidates.find((item) => !!item) || null;
};

const authFetch = async (url: string, init?: RequestInit) => {
  const token = await getAuthToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...init,
    headers,
  });
};

export interface ProfilePayload {
  userId: string;
  phoneNumber: string;
  fullName?: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  avatarUrl?: string;
  coverImage?: string;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: ProfilePayload;
  timestamp: string;
}

export const profileApi = {
  async getProfile() {
    const response = await authFetch(`${API_BASE_URL}/users/profile`);
    return toJson<ProfileResponse>(response);
  },
};
