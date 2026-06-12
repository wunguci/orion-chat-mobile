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

export type NotificationSettingsResponse = {
  id?: string;
  userId?: string;
  muteAll?: boolean;
  messageNotifications?: boolean;
  friendRequestNotifications?: boolean;
  groupNotifications?: boolean;
  tagNotifications?: boolean;
  callNotifications?: boolean;
  notificationSound?: string;
  doNotDisturbStart?: number;
  doNotDisturbEnd?: number;
};

export type ProfileVisibility = "public" | "friends" | "private";
export type ContactPermission = "everyone" | "friends" | "nobody";

export type PrivacySettingsResponse = {
  id?: string;
  userId?: string;
  profileVisibility?: ProfileVisibility;
  messagePermission?: ContactPermission;
  callPermission?: ContactPermission;
  lastSeenVisibility?: boolean;
  onlineStatusVisibility?: boolean;
  allowAIToSeeProfile?: boolean;
  allowAIToSeeMessages?: boolean;
  allowAIToSeeMedia?: boolean;
  allowScreenSharing?: boolean;
  allowDataCollection?: boolean;
  allowAnalytics?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const extractErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as {
    message?: unknown;
    error?: unknown;
  };

  if (typeof data.message === "string") return data.message;

  if (data.message && typeof data.message === "object") {
    const nested = data.message as { message?: unknown; error?: unknown };
    if (typeof nested.message === "string") return nested.message;
    if (typeof nested.error === "string") return nested.error;
  }

  if (typeof data.error === "string") return data.error;

  return fallback;
};

const toJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, `Request failed: ${response.status}`),
    );
  }

  return data as T;
};

const authFetch = async (url: string, init?: RequestInit) => {
  const token = await tokenUtils.getToken();

  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Platform": "mobile",
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export const notificationSettingsApi = {
  async getMySettings() {
    const response = await authFetch(buildUrl("/notification-settings/me"));
    return toJson<NotificationSettingsResponse>(response);
  },

  async updateMySettings(payload: Partial<NotificationSettingsResponse>) {
    const response = await authFetch(buildUrl("/notification-settings/me/update"), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return toJson<NotificationSettingsResponse>(response);
  },

  async toggleMute() {
    const response = await authFetch(buildUrl("/notification-settings/me/toggle-mute"), {
      method: "PATCH",
    });
    return toJson<NotificationSettingsResponse>(response);
  },
};

export const privacySettingsApi = {
  async getMySettings() {
    const response = await authFetch(buildUrl("/privacy-settings/me"));
    return toJson<PrivacySettingsResponse>(response);
  },

  async updateMySettings(payload: Partial<PrivacySettingsResponse>) {
    const response = await authFetch(buildUrl("/privacy-settings/me/update"), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return toJson<PrivacySettingsResponse>(response);
  },
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
