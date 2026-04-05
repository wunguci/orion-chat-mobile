import { API_BASE_URL } from "./profile";

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    phoneNumber: string;
    fullName?: string;
    birthDate?: string;
    gender?: string;
    loginTime?: string;
    userId: string;
    email?: string;
    avatarUrl?: string;
    coverImage?: string;
    isOnline?: boolean;
    showOnlineStatus?: boolean;
    isActive?: boolean;
    createdAt?: string;
    lastLoginAt?: string;
  };
  timestamp: string;
}

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
};

export const authApi = {
  async login(phoneNumber: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, password }),
    });

    return toJson<LoginResponse>(response);
  },
};
