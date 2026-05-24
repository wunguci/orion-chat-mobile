import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, fetchWithTimeout } from "@/config/api";

export type StreamVideoTokenResponse = {
  apiKey: string;
  token: string;
  user: {
    id: string;
    name?: string;
    image?: string;
  };
};

const getAuthToken = async () => {
  const tokenCandidates = [
    await AsyncStorage.getItem("auth_token"),
    await AsyncStorage.getItem("token"),
    await AsyncStorage.getItem("accessToken"),
  ];

  return tokenCandidates.find(Boolean) || null;
};

export const streamVideoApi = {
  async getToken(payload?: {
    userId?: string;
    name?: string;
    image?: string;
  }): Promise<StreamVideoTokenResponse> {
    const token = await getAuthToken();
    const response = await fetchWithTimeout(`${API_BASE_URL}/stream-video/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Platform": "mobile",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload || {}),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Stream video token failed: ${response.status}`);
    }

    return (await response.json()) as StreamVideoTokenResponse;
  },
};
