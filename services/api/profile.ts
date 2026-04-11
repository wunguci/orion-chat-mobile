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
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
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
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
