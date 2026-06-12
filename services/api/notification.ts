import API_BASE_URL from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AppNotification,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/notification";

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

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
  headers.set("Content-Type", "application/json");
  headers.set("X-Platform", "mobile");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...init,
    headers,
  });
};

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
};

export const notificationApi = {
  async getMyNotifications(limit = 20, skip = 0) {
    const response = await authFetch(
      buildUrl(`/notifications/me?limit=${limit}&skip=${skip}`),
    );
    return toJson<NotificationListResponse>(response);
  },

  async getUnreadCount() {
    const response = await authFetch(
      buildUrl("/notifications/me/unread-count"),
    );
    return toJson<UnreadCountResponse>(response);
  },

  async markAsRead(id: string) {
    const response = await authFetch(buildUrl(`/notifications/${id}/read`), {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    return toJson<AppNotification>(response);
  },

  async markAllAsRead() {
    const response = await authFetch(buildUrl("/notifications/me/read-all"), {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    return toJson<{ success: boolean }>(response);
  },

  async remove(id: string) {
    const response = await authFetch(buildUrl(`/notifications/${id}`), {
      method: "DELETE",
    });
    return toJson<{ success: boolean }>(response);
  },
};
