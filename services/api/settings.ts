import { API_BASE_URL } from "@/config/api";
import { tokenUtils } from "@/utils/tokenUtils";

export type UserSettingsResponse = {
  id?: string;
  userId?: string;
  theme?: string;
  appearanceColor?: string;
  fontSize?: number;
  wallpaper?: string;
  fontFamily?: string;
  accentColor?: string;
};

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const toJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data as T;
};

const authFetch = async (url: string, init?: RequestInit) => {
  const token = await tokenUtils.getToken();

  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export const settingsApi = {
  async getMySettings() {
    const response = await authFetch(buildUrl("/user-settings/me"));
    return toJson<UserSettingsResponse>(response);
  },

  async updateMySettings(payload: Partial<UserSettingsResponse>) {
    const response = await authFetch(buildUrl("/user-settings/me/update"), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return toJson<UserSettingsResponse>(response);
  },
};
