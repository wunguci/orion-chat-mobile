import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../../config/api";

// Get auth token from storage keys used across the app.
const getAuthToken = async () => {
  const tokenCandidates = [
    await AsyncStorage.getItem("auth_token"),
    await AsyncStorage.getItem("token"),
    await AsyncStorage.getItem("accessToken"),
  ];

  return tokenCandidates.find((item) => !!item) || null;
};

const appendFile = (
  formData: FormData,
  fieldName: "avatar" | "cover",
  file: { uri: string; name: string; type: string },
) => {
  formData.append(fieldName, {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);
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
  isDeleted?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: ProfilePayload;
  timestamp: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
}

export interface UpdateProfileFiles {
  avatar?: {
    uri: string;
    name: string;
    type: string;
  };
  cover?: {
    uri: string;
    name: string;
    type: string;
  };
}

const buildNetworkErrorMessage = (url: string) =>
  [
    "Network request failed khi gọi API update profile.",
    `Backend URL hiện tại: ${url}`,
    "Nếu bạn đang dùng iPhone thật (không cùng Wi-Fi với máy dev), hãy cấu hình EXPO_PUBLIC_API_URL trỏ tới URL public (ví dụ ngrok) hoặc IP LAN của máy chạy backend.",
  ].join(" ");

const toApiError = async (response: Response) => {
  let message = `HTTP ${response.status}`;
  try {
    const data = await response.json();
    if (data && typeof data === "object" && "message" in data) {
      if (typeof data.message === "string") {
        message = data.message;
      } else if (Array.isArray(data.message)) {
        message = data.message.join(". ");
      }
    }
  } catch {
    const text = await response.text().catch(() => "");
    if (text) message = text;
  }

  throw new Error(message);
};

export const profileApi = {
  async getProfile() {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/users/profile`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await toApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (
        error instanceof TypeError &&
        /network request failed/i.test(error.message)
      ) {
        throw new Error(buildNetworkErrorMessage(url));
      }
      throw error;
    }
  },

  async updateProfile(
    updateData: UpdateProfileDto,
    files?: UpdateProfileFiles,
  ) {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/users/profile`;

    try {
      if (!files?.avatar && !files?.cover) {
        const payload = {
          ...(updateData.fullName && { fullName: updateData.fullName }),
          ...(updateData.email && { email: updateData.email }),
          ...(updateData.phoneNumber && {
            phoneNumber: updateData.phoneNumber,
          }),
          ...(updateData.birthDate && { birthDate: updateData.birthDate }),
          ...(updateData.gender && { gender: updateData.gender }),
        };

        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }

        return await response.json();
      }

      const formData = new FormData();

      if (updateData.fullName) {
        formData.append("fullName", updateData.fullName);
      }
      if (updateData.email) {
        formData.append("email", updateData.email);
      }
      if (updateData.phoneNumber) {
        formData.append("phoneNumber", updateData.phoneNumber);
      }
      if (updateData.birthDate) {
        formData.append("birthDate", updateData.birthDate);
      }
      if (updateData.gender) {
        formData.append("gender", updateData.gender);
      }

      if (files?.avatar) {
        appendFile(formData, "avatar", files.avatar);
      }

      if (files?.cover) {
        appendFile(formData, "cover", files.cover);
      }

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        await toApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (
        error instanceof TypeError &&
        /network request failed/i.test(error.message)
      ) {
        throw new Error(buildNetworkErrorMessage(url));
      }
      throw error;
    }
  },
};
